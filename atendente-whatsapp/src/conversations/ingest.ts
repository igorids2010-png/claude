import type { Db } from "../db/db.js";
import type { Logger } from "../lib/logger.js";
import { findChannelByPhoneNumberId } from "../clinics/channels.js";
import { enqueueConversationJob, type DebounceOptions } from "../queue/jobs.js";
import type { InboundMessage, ParsedWebhook, StatusUpdate } from "../whatsapp/payload.js";

export interface IngestOptions extends DebounceOptions {
  inboundMaxAgeMs: number;
}

export interface IngestResult {
  stored: number;
  duplicates: number;
  /** Mensagens para números que não pertencem a nenhuma clínica ativa. */
  unknownChannel: number;
  /** Gravadas mas não respondidas (muito antigas ou só reações). */
  notEnqueued: number;
  statusesApplied: number;
}

/** Status que podem evoluir para cada status novo (a Meta pode entregar fora de ordem). */
const STATUS_PREDECESSORS: Record<string, string[]> = {
  sent: ["sending"],
  delivered: ["sending", "sent"],
  read: ["sending", "sent", "delivered"],
  failed: ["sending", "sent", "delivered"],
};

/**
 * Grava o que chegou no webhook. Cada mensagem é uma transação: paciente, conversa,
 * mensagem e job entram juntos ou não entram. O UNIQUE em wa_message_id torna a
 * operação idempotente: a Meta reenvia o mesmo evento e nada é duplicado.
 */
export async function ingestWebhook(
  db: Db,
  parsed: ParsedWebhook,
  options: IngestOptions,
  logger: Logger,
): Promise<IngestResult> {
  const result: IngestResult = { stored: 0, duplicates: 0, unknownChannel: 0, notEnqueued: 0, statusesApplied: 0 };

  for (const message of parsed.messages) {
    const outcome = await ingestMessage(db, message, options);
    if (outcome === "unknown_channel") {
      result.unknownChannel++;
      logger.warn({ phoneNumberId: message.phoneNumberId }, "mensagem para número sem clínica ativa");
    } else if (outcome === "duplicate") {
      result.duplicates++;
    } else {
      result.stored++;
      if (outcome === "stored") result.notEnqueued++;
    }
  }

  for (const status of parsed.statuses) {
    if (await applyStatus(db, status)) result.statusesApplied++;
  }
  return result;
}

type MessageOutcome = "unknown_channel" | "duplicate" | "stored" | "enqueued";

async function ingestMessage(db: Db, message: InboundMessage, options: IngestOptions): Promise<MessageOutcome> {
  return db.transaction(async (tx) => {
    const channel = await findChannelByPhoneNumberId(tx, message.phoneNumberId);
    if (!channel || !channel.channel_active || !channel.clinic_active) return "unknown_channel";

    const patient = await tx.query<{ id: string }>(
      `insert into patients (clinic_id, wa_id) values ($1, $2)
       on conflict (clinic_id, wa_id) do update set updated_at = patients.updated_at
       returning id`,
      [channel.clinic_id, message.waId],
    );
    const conversation = await tx.query<{ id: string }>(
      `insert into conversations (clinic_id, channel_id, patient_id, last_inbound_at)
       values ($1, $2, $3, $4)
       on conflict (channel_id, patient_id) do update
         set last_inbound_at = greatest(conversations.last_inbound_at, excluded.last_inbound_at),
             updated_at = now()
       returning id`,
      [channel.clinic_id, channel.channel_id, patient.rows[0]!.id, message.timestamp],
    );
    const conversationId = conversation.rows[0]!.id;

    const inserted = await tx.query<{ id: string }>(
      `insert into messages (clinic_id, conversation_id, direction, wa_message_id, type, body, status, wa_timestamp)
       values ($1, $2, 'inbound', $3, $4, $5, 'received', $6)
       on conflict (wa_message_id) do nothing
       returning id`,
      [channel.clinic_id, conversationId, message.waMessageId, message.kind, message.body, message.timestamp],
    );
    if (inserted.rows.length === 0) return "duplicate";

    const tooOld = Date.now() - message.timestamp.getTime() > options.inboundMaxAgeMs;
    if (message.kind === "reaction" || tooOld) {
      // Não há o que responder: a mensagem fica registrada e já sai como tratada.
      await tx.query(`update messages set handled_at = now() where id = $1`, [inserted.rows[0]!.id]);
      return "stored";
    }

    await enqueueConversationJob(tx, conversationId, options);
    return "enqueued";
  });
}

async function applyStatus(db: Db, status: StatusUpdate): Promise<boolean> {
  const predecessors = STATUS_PREDECESSORS[status.status];
  if (!predecessors) return false;
  const { rows } = await db.query<{ id: string }>(
    `update messages
     set status = $2,
         error = case when $2 = 'failed' then jsonb_build_object('code', $4::int) else error end,
         updated_at = now()
     where wa_message_id = $1 and direction = 'outbound' and status = any($3::text[])
     returning id`,
    [status.waMessageId, status.status, predecessors, status.errorCode ?? null],
  );
  return rows.length > 0;
}
