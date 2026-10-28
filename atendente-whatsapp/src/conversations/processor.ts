import type { Db } from "../db/db.js";
import { decryptSecret } from "../lib/crypto.js";
import type { Logger } from "../lib/logger.js";
import type { Job } from "../queue/jobs.js";
import { PermanentJobError, type JobHandler } from "../queue/worker.js";
import { splitText, WhatsAppApiError, type SendTarget, type WhatsAppClient } from "../whatsapp/client.js";
import { MEDIA_KINDS, READABLE_KINDS, type MessageKind } from "../whatsapp/payload.js";
import type { PendingInbound, Responder } from "./responder.js";
import { disclosureText, MEDIA_NOT_SUPPORTED_TEXT } from "./texts.js";

export interface ProcessorDeps {
  db: Db;
  whatsapp: WhatsAppClient;
  responder: Responder;
  encryptionKey: string;
  logger: Logger;
}

interface ConversationRow {
  conversation_id: string;
  status: "bot" | "human";
  disclosure_sent_at: Date | null;
  clinic_id: string;
  clinic_name: string;
  clinic_active: boolean;
  channel_active: boolean;
  phone_number_id: string;
  access_token_ciphertext: string;
  patient_wa_id: string;
}

interface PlannedReply {
  /** Chave estável: numa nova tentativa do job, o que já foi enviado não sai de novo. */
  dedupeKey: string;
  text: string;
}

/**
 * Handler do job "process_conversation": responde todas as mensagens do paciente que
 * ainda não foram tratadas, numa ordem fixa: aviso de atendimento automatizado (só na
 * primeira vez), aviso de mídia não suportada e a resposta para os textos.
 */
export function createConversationProcessor(deps: ProcessorDeps): JobHandler {
  return async (job: Job) => {
    if (!job.conversation_id) throw new PermanentJobError("Job sem conversation_id");
    const log = deps.logger.child({ jobId: job.id, conversationId: job.conversation_id });

    const conversation = await loadConversation(deps.db, job.conversation_id);
    if (!conversation) throw new PermanentJobError("Conversa não encontrada");

    const pending = await loadPendingInbound(deps.db, conversation.conversation_id);
    if (pending.length === 0) return;

    // Clínica desativada, ou a equipe assumiu a conversa: o bot fica em silêncio.
    if (!conversation.clinic_active || !conversation.channel_active || conversation.status === "human") {
      await markHandled(deps.db, pending);
      log.info({ status: conversation.status }, "mensagens registradas sem resposta automática");
      return;
    }

    const target: SendTarget = {
      phoneNumberId: conversation.phone_number_id,
      accessToken: decryptSecret(conversation.access_token_ciphertext, deps.encryptionKey),
    };
    const last = pending[pending.length - 1]!;

    // Marcar como lida é cortesia: se falhar, seguimos com a resposta.
    await deps.whatsapp.markAsRead(target, last.wa_message_id).catch((error: unknown) => {
      log.warn({ err: (error as Error).message }, "não foi possível marcar como lida");
    });

    const readable = pending.filter((message) => READABLE_KINDS.has(message.type as MessageKind) && message.body);
    const hasMedia = pending.some(
      (message) => MEDIA_KINDS.has(message.type as MessageKind) || message.type === "unsupported",
    );

    const replies: PlannedReply[] = [];
    if (hasMedia) replies.push({ dedupeKey: `${last.id}:media`, text: MEDIA_NOT_SUPPORTED_TEXT });
    if (readable.length > 0) {
      const texts = await deps.responder.reply({
        clinicId: conversation.clinic_id,
        clinicName: conversation.clinic_name,
        conversationId: conversation.conversation_id,
        messages: readable.map<PendingInbound>((message) => ({
          id: message.id,
          kind: message.type,
          body: message.body,
        })),
      });
      texts
        .flatMap((text) => splitText(text))
        .forEach((text, index) => replies.push({ dedupeKey: `${last.id}:reply:${index}`, text }));
    }

    if (replies.length > 0 && !conversation.disclosure_sent_at) {
      replies.unshift({
        dedupeKey: `${conversation.conversation_id}:disclosure`,
        text: disclosureText(conversation.clinic_name),
      });
    }

    for (const reply of replies) {
      await sendOnce(deps, conversation, target, reply);
    }

    await deps.db.transaction(async (tx) => {
      if (replies.length > 0 && !conversation.disclosure_sent_at) {
        await tx.query(`update conversations set disclosure_sent_at = now(), updated_at = now() where id = $1`, [
          conversation.conversation_id,
        ]);
      }
      await markHandled(tx, pending);
    });
    log.info({ handled: pending.length, sent: replies.length }, "conversa processada");
  };
}

async function sendOnce(
  deps: ProcessorDeps,
  conversation: ConversationRow,
  target: SendTarget,
  reply: PlannedReply,
): Promise<void> {
  // Reserva a "vaga" da resposta. Se ela já foi enviada numa tentativa anterior, pula.
  const { rows } = await deps.db.query<{ id: string; status: string }>(
    `insert into messages (clinic_id, conversation_id, direction, dedupe_key, type, body, status)
     values ($1, $2, 'outbound', $3, 'text', $4, 'sending')
     on conflict (dedupe_key) do update set updated_at = now()
     returning id, status`,
    [conversation.clinic_id, conversation.conversation_id, reply.dedupeKey, reply.text],
  );
  const row = rows[0]!;
  if (row.status !== "sending" && row.status !== "failed") return;

  try {
    const { waMessageId } = await deps.whatsapp.sendText(target, conversation.patient_wa_id, reply.text);
    await deps.db.query(
      `update messages set wa_message_id = $2, status = 'sent', body = $3, error = null, updated_at = now() where id = $1`,
      [row.id, waMessageId, reply.text],
    );
  } catch (error) {
    const details =
      error instanceof WhatsAppApiError
        ? { httpStatus: error.httpStatus ?? null, code: error.code ?? null, message: error.message }
        : { message: (error as Error).message };
    await deps.db.query(`update messages set status = 'failed', error = $2, updated_at = now() where id = $1`, [
      row.id,
      JSON.stringify(details),
    ]);
    throw error;
  }
}

async function loadConversation(db: Db, conversationId: string): Promise<ConversationRow | null> {
  const { rows } = await db.query<ConversationRow>(
    `select cv.id as conversation_id, cv.status, cv.disclosure_sent_at,
            c.id as clinic_id, c.name as clinic_name, c.active as clinic_active,
            ch.active as channel_active, ch.phone_number_id, ch.access_token_ciphertext,
            p.wa_id as patient_wa_id
     from conversations cv
     join clinics c on c.id = cv.clinic_id
     join clinic_channels ch on ch.id = cv.channel_id
     join patients p on p.id = cv.patient_id
     where cv.id = $1`,
    [conversationId],
  );
  return rows[0] ?? null;
}

interface PendingRow {
  id: string;
  wa_message_id: string;
  type: string;
  body: string | null;
}

async function loadPendingInbound(db: Db, conversationId: string): Promise<PendingRow[]> {
  const { rows } = await db.query<PendingRow>(
    `select id, wa_message_id, type, body
     from messages
     where conversation_id = $1 and direction = 'inbound' and handled_at is null
     order by wa_timestamp, created_at`,
    [conversationId],
  );
  return rows;
}

async function markHandled(db: Pick<Db, "query">, messages: PendingRow[]): Promise<void> {
  await db.query(`update messages set handled_at = now(), updated_at = now() where id = any($1::uuid[])`, [
    messages.map((message) => message.id),
  ]);
}
