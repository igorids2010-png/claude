import type { Db, Queryable } from "../db/db.js";
import { decryptSecret } from "../lib/crypto.js";
import type { Logger } from "../lib/logger.js";
import { toLocal } from "../lib/time.js";
import type { Job } from "../queue/jobs.js";
import { PermanentJobError, type JobHandler } from "../queue/worker.js";
import { formatPhone, sendToStaff } from "../team/alerts.js";
import { WhatsAppApiError, type SendTarget, type WhatsAppClient } from "../whatsapp/client.js";
import { releaseHandoff, startHandoff } from "./handoff.js";

export const STAFF_COMMAND = "staff_command";

export type StaffCommand =
  | { type: "help" }
  | { type: "list" }
  | { type: "release"; code: string }
  | { type: "assume"; code: string }
  | { type: "relay"; code: string; text: string };

/**
 * Mensagens da recepção para o número da clínica:
 *   #A3F9C texto     responde ao paciente da conversa A3F9C
 *   #A3F9C /bot      devolve a conversa ao atendente automático
 *   #A3F9C /assumir  a equipe assume a conversa (o bot para de responder)
 *   /lista           conversas em atendimento humano
 *   /ajuda           os comandos
 */
export function parseStaffCommand(body: string): StaffCommand {
  const text = body.trim();
  if (/^\/lista\b/i.test(text)) return { type: "list" };
  const match = /^#([0-9a-f]{5})\b\s*([\s\S]*)$/i.exec(text) ?? /^\/(bot|assumir)\s+#?([0-9a-f]{5})\s*$/i.exec(text);
  if (!match) return { type: "help" };

  // Forma "/bot A3F9C"
  if (/^\//.test(text)) {
    const code = match[2]!.toUpperCase();
    return match[1]!.toLowerCase() === "bot" ? { type: "release", code } : { type: "assume", code };
  }
  const code = match[1]!.toUpperCase();
  const rest = match[2]!.trim();
  if (/^\/bot$/i.test(rest)) return { type: "release", code };
  if (/^\/assumir$/i.test(rest)) return { type: "assume", code };
  if (!rest) return { type: "help" };
  return { type: "relay", code, text: rest };
}

const HELP_TEXT = [
  "Comandos da recepção:",
  "• #CÓDIGO sua mensagem: responde ao paciente",
  "• #CÓDIGO /bot: devolve a conversa ao atendente automático",
  "• #CÓDIGO /assumir: assume a conversa (o bot para de responder)",
  "• /lista: conversas em atendimento humano",
  "O código aparece nos avisos, ex.: #A3F9C.",
].join("\n");

interface StaffRow {
  id: string;
  clinic_id: string;
  from_wa_id: string;
  type: string;
  body: string | null;
  handled_at: Date | null;
  phone_number_id: string;
  access_token_ciphertext: string;
  timezone: string;
  team_alert_template: string | null;
}

interface ConversationByCode {
  id: string;
  status: "bot" | "human";
  patient_wa_id: string;
  patient_name: string | null;
}

async function findByCode(db: Queryable, clinicId: string, code: string): Promise<ConversationByCode | null> {
  const { rows } = await db.query<ConversationByCode>(
    `select cv.id, cv.status, p.wa_id as patient_wa_id, p.name as patient_name
     from conversations cv join patients p on p.id = cv.patient_id
     where cv.clinic_id = $1 and cv.short_code = $2`,
    [clinicId, code],
  );
  return rows[0] ?? null;
}

export function createStaffCommandHandler(deps: {
  db: Db;
  whatsapp: WhatsAppClient;
  encryptionKey: string;
  logger: Logger;
  jobMaxAttempts: number;
}): JobHandler {
  return async (job: Job) => {
    const inboundId = job.payload.staffInboundId;
    if (typeof inboundId !== "string") throw new PermanentJobError("Job da equipe sem staffInboundId");

    const { rows } = await deps.db.query<StaffRow>(
      `select si.id, si.clinic_id, si.from_wa_id, si.type, si.body, si.handled_at,
              ch.phone_number_id, ch.access_token_ciphertext, c.timezone, c.team_alert_template
       from staff_inbound si
       join clinic_channels ch on ch.id = si.channel_id
       join clinics c on c.id = si.clinic_id
       where si.id = $1`,
      [inboundId],
    );
    const inbound = rows[0];
    if (!inbound || inbound.handled_at) return;
    const log = deps.logger.child({ staffInboundId: inbound.id, clinicId: inbound.clinic_id });
    const target: SendTarget = {
      phoneNumberId: inbound.phone_number_id,
      accessToken: decryptSecret(inbound.access_token_ciphertext, deps.encryptionKey),
    };
    // A recepção acabou de escrever: a janela de 24h com ela está aberta.
    const replyToStaff = (text: string) => deps.whatsapp.sendText(target, inbound.from_wa_id, text);
    const done = () => deps.db.query(`update staff_inbound set handled_at = now() where id = $1`, [inbound.id]);

    if (inbound.type !== "text" || !inbound.body) {
      await replyToStaff("Por enquanto a ponte com o paciente só envia texto.");
      await done();
      return;
    }

    const command = parseStaffCommand(inbound.body);
    if (command.type === "help") {
      await replyToStaff(HELP_TEXT);
      await done();
      return;
    }

    if (command.type === "list") {
      const open = await deps.db.query<{ short_code: string; wa_id: string; name: string | null; started_at: Date }>(
        `select cv.short_code, p.wa_id, p.name, h.started_at
         from conversations cv
         join patients p on p.id = cv.patient_id
         left join handoffs h on h.conversation_id = cv.id and h.ended_at is null
         where cv.clinic_id = $1 and cv.status = 'human'
         order by h.started_at nulls last limit 20`,
        [inbound.clinic_id],
      );
      const lines = open.rows.map((row) => {
        const since = row.started_at ? toLocal(new Date(row.started_at), inbound.timezone) : null;
        const who = [row.name, formatPhone(row.wa_id)].filter(Boolean).join(" · ");
        return `• #${row.short_code} ${who}${since ? ` (desde ${since.date.slice(8, 10)}/${since.date.slice(5, 7)} ${since.time})` : ""}`;
      });
      await replyToStaff(lines.length ? `Em atendimento humano:\n${lines.join("\n")}` : "Nenhuma conversa em atendimento humano agora.");
      await done();
      return;
    }

    const conversation = await findByCode(deps.db, inbound.clinic_id, command.code);
    if (!conversation) {
      await replyToStaff(`Não encontrei a conversa #${command.code}. Mande /lista para ver as abertas.`);
      await done();
      return;
    }

    if (command.type === "release") {
      const { released } = await releaseHandoff(deps.db, conversation.id, "staff");
      await replyToStaff(
        released
          ? `✅ #${command.code} voltou para o atendente automático.`
          : `#${command.code} já estava com o atendente automático.`,
      );
      await done();
      return;
    }

    if (command.type === "assume") {
      await startHandoff(deps.db, {
        clinicId: inbound.clinic_id,
        conversationId: conversation.id,
        reason: "staff",
        summary: "A equipe assumiu a conversa.",
        startedBy: "staff",
        sourceMessageId: null,
        jobMaxAttempts: deps.jobMaxAttempts,
        notifyTeam: false,
      });
      await replyToStaff(`✅ Você assumiu #${command.code}. O atendente automático fica em silêncio até você mandar #${command.code} /bot.`);
      await done();
      return;
    }

    // Responder ao paciente. Se a conversa estava com o bot, a equipe assume automaticamente.
    if (conversation.status === "bot") {
      await startHandoff(deps.db, {
        clinicId: inbound.clinic_id,
        conversationId: conversation.id,
        reason: "staff",
        summary: "A equipe respondeu o paciente diretamente.",
        startedBy: "staff",
        sourceMessageId: null,
        jobMaxAttempts: deps.jobMaxAttempts,
        notifyTeam: false,
      });
    }

    const dedupeKey = `staff:${inbound.id}`;
    const { rows: reserved } = await deps.db.query<{ id: string; status: string }>(
      `insert into messages (clinic_id, conversation_id, direction, author, dedupe_key, type, body, status)
       values ($1, $2, 'outbound', 'staff', $3, 'text', $4, 'sending')
       on conflict (dedupe_key) do update set updated_at = now()
       returning id, status`,
      [inbound.clinic_id, conversation.id, dedupeKey, command.text],
    );
    const row = reserved[0]!;
    if (row.status === "sending" || row.status === "failed") {
      try {
        const { waMessageId } = await deps.whatsapp.sendText(target, conversation.patient_wa_id, command.text);
        await deps.db.query(`update messages set wa_message_id = $2, status = 'sent', updated_at = now() where id = $1`, [row.id, waMessageId]);
      } catch (error) {
        await deps.db.query(`update messages set status = 'failed', updated_at = now() where id = $1`, [row.id]);
        if (error instanceof WhatsAppApiError && !error.retryable) {
          const reason =
            error.code === 131047
              ? "o paciente não escreve há mais de 24h, e a Meta só permite mensagem com template aprovado"
              : error.message;
          await replyToStaff(`⚠️ Não consegui enviar para #${command.code}: ${reason}.`);
          await done();
          return;
        }
        throw error;
      }
    }
    await deps.db.query(
      `update handoffs set last_staff_message_at = now() where conversation_id = $1 and ended_at is null`,
      [conversation.id],
    );
    await done();
    log.info({ conversationId: conversation.id }, "mensagem da equipe enviada ao paciente");
  };
}

interface ForwardTarget {
  clinicId: string;
  conversationId: string;
  shortCode: string;
  patientWaId: string;
  patientName: string | null;
  staffWaId: string | null;
  template: string | null;
  target: SendTarget;
}

const MEDIA_LABEL: Record<string, string> = {
  audio: "[áudio]",
  image: "[imagem]",
  sticker: "[figurinha]",
  video: "[vídeo]",
  document: "[documento]",
  location: "[localização]",
  contacts: "[contato]",
  reaction: "[reação]",
  unsupported: "[mensagem não suportada]",
};

/**
 * Durante o atendimento humano, as mensagens do paciente vão para a recepção, com o código
 * da conversa para ela responder. Mídias aparecem como [áudio], [imagem]...: por enquanto a
 * ponte não repassa arquivos.
 */
export async function forwardToStaff(
  whatsapp: WhatsAppClient,
  forward: ForwardTarget,
  messages: Array<{ type: string; body: string | null }>,
): Promise<boolean> {
  if (!forward.staffWaId) return false;
  const who = [forward.patientName, formatPhone(forward.patientWaId)].filter(Boolean).join(" · ");
  const lines = messages.map((m) => (m.body?.trim() ? m.body.trim() : (MEDIA_LABEL[m.type] ?? `[${m.type}]`)));
  const text = `💬 #${forward.shortCode} ${who}:\n${lines.join("\n")}\n\n(responda com #${forward.shortCode} sua mensagem)`;
  await sendToStaff(whatsapp, forward.target, forward.staffWaId, text, forward.template);
  return true;
}
