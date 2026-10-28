import type { Db, Queryable } from "../db/db.js";
import { decryptSecret } from "../lib/crypto.js";
import type { Logger } from "../lib/logger.js";
import { DELIVER_STAFF_ALERT, enqueueJob, type Job } from "../queue/jobs.js";
import { PermanentJobError, type JobHandler } from "../queue/worker.js";
import { WhatsAppApiError, type WhatsAppClient } from "../whatsapp/client.js";

export type AlertKind =
  | "emergency"
  | "human_requested"
  | "unanswered_question"
  | "scheduling_request"
  | "complaint"
  | "data_deletion"
  | "ai_failure"
  | "other";

const KIND_LABEL: Record<AlertKind, string> = {
  emergency: "🚨 EMERGÊNCIA",
  human_requested: "🙋 Paciente pediu atendimento humano",
  unanswered_question: "❓ Dúvida que o atendente não soube responder",
  scheduling_request: "📅 Pedido de agendamento",
  complaint: "⚠️ Reclamação",
  data_deletion: "🗑️ Pedido de exclusão de dados (LGPD)",
  ai_failure: "⚙️ Falha no atendente automático",
  other: "ℹ️ Aviso do atendente",
};

export interface NewAlert {
  clinicId: string;
  conversationId: string;
  kind: AlertKind;
  summary: string;
  sourceMessageId: string | null;
}

/**
 * Registra o alerta e agenda a entrega para a recepção. A entrega roda num job próprio:
 * se o WhatsApp falhar, ela é repetida sem atrasar a resposta ao paciente. O mesmo tipo de
 * alerta para a mesma mensagem do paciente não é criado duas vezes.
 */
export async function createAlert(db: Db, alert: NewAlert, options: { maxAttempts: number }): Promise<boolean> {
  return db.transaction(async (tx) => {
    const { rows } = await tx.query<{ id: string }>(
      `insert into staff_alerts (clinic_id, conversation_id, kind, summary, source_message_id)
       values ($1, $2, $3, $4, $5)
       on conflict (conversation_id, kind, source_message_id) do nothing
       returning id`,
      [alert.clinicId, alert.conversationId, alert.kind, alert.summary.slice(0, 1000), alert.sourceMessageId],
    );
    if (!rows[0]) return false;
    await enqueueJob(tx, DELIVER_STAFF_ALERT, { alertId: rows[0].id }, options);
    return true;
  });
}

export async function hasRecentAlert(db: Queryable, conversationId: string, kind: AlertKind, withinMs: number): Promise<boolean> {
  const { rows } = await db.query(
    `select 1 from staff_alerts
     where conversation_id = $1 and kind = $2 and created_at > now() - make_interval(secs => $3::double precision / 1000)
     limit 1`,
    [conversationId, kind, withinMs],
  );
  return rows.length > 0;
}

/** "5511987654321" -> "+55 11 98765-4321" (só para leitura da equipe). */
export function formatPhone(waId: string): string {
  const match = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(waId);
  return match ? `+55 ${match[1]} ${match[2]}-${match[3]}` : `+${waId}`;
}

/** Parâmetros de template não aceitam quebra de linha, tab nem 4+ espaços seguidos. */
export function templateParam(text: string, max = 900): string {
  return text.replace(/[\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, max);
}

interface AlertRow {
  id: string;
  kind: AlertKind;
  summary: string;
  delivery_status: string;
  team_alert_wa_id: string | null;
  team_alert_template: string | null;
  phone_number_id: string;
  access_token_ciphertext: string;
  patient_wa_id: string;
}

export function createAlertDeliveryHandler(deps: {
  db: Db;
  whatsapp: WhatsAppClient;
  encryptionKey: string;
  logger: Logger;
}): JobHandler {
  return async (job: Job) => {
    const alertId = job.payload.alertId;
    if (typeof alertId !== "string") throw new PermanentJobError("Job de alerta sem alertId");

    const { rows } = await deps.db.query<AlertRow>(
      `select a.id, a.kind, a.summary, a.delivery_status, c.team_alert_wa_id, c.team_alert_template,
              ch.phone_number_id, ch.access_token_ciphertext, p.wa_id as patient_wa_id
       from staff_alerts a
       join clinics c on c.id = a.clinic_id
       join conversations cv on cv.id = a.conversation_id
       join clinic_channels ch on ch.id = cv.channel_id
       join patients p on p.id = cv.patient_id
       where a.id = $1`,
      [alertId],
    );
    const alert = rows[0];
    if (!alert || alert.delivery_status === "sent") return;
    const log = deps.logger.child({ alertId, kind: alert.kind });

    if (!alert.team_alert_wa_id) {
      await setStatus(deps.db, alert.id, "no_destination", null);
      log.warn("clínica sem WhatsApp da equipe configurado (team.alert_whatsapp): alerta só registrado");
      return;
    }

    const target = {
      phoneNumberId: alert.phone_number_id,
      accessToken: decryptSecret(alert.access_token_ciphertext, deps.encryptionKey),
    };
    const patient = formatPhone(alert.patient_wa_id);
    const text = `${KIND_LABEL[alert.kind]}\nPaciente: ${patient}\n${alert.summary}`;

    try {
      await deps.whatsapp.sendText(target, alert.team_alert_wa_id, text);
    } catch (error) {
      // Fora da janela de 24h com a recepção: só um template aprovado pode iniciar a conversa.
      const windowClosed = error instanceof WhatsAppApiError && error.code === 131047;
      if (!windowClosed || !alert.team_alert_template) {
        await setStatus(deps.db, alert.id, "failed", describe(error));
        throw error;
      }
      try {
        await deps.whatsapp.sendTemplate(target, alert.team_alert_wa_id, {
          name: alert.team_alert_template,
          languageCode: "pt_BR",
          bodyParams: [templateParam(`${KIND_LABEL[alert.kind]} | Paciente: ${patient} | ${alert.summary}`)],
        });
      } catch (templateError) {
        await setStatus(deps.db, alert.id, "failed", describe(templateError));
        throw templateError;
      }
    }
    await setStatus(deps.db, alert.id, "sent", null);
    log.info("alerta entregue à equipe");
  };
}

function describe(error: unknown) {
  return error instanceof WhatsAppApiError
    ? { httpStatus: error.httpStatus ?? null, code: error.code ?? null, message: error.message }
    : { message: (error as Error).message };
}

async function setStatus(db: Queryable, alertId: string, status: string, error: unknown): Promise<void> {
  await db.query(`update staff_alerts set delivery_status = $2, delivery_error = $3 where id = $1`, [
    alertId,
    status,
    error === null ? null : JSON.stringify(error),
  ]);
}
