import type { Db, Queryable } from "../db/db.js";
import { createAlert } from "../team/alerts.js";

export type HandoffReason = "patient_request" | "frustrated" | "out_of_scope" | "unresolved" | "emergency" | "staff" | "other";
export type HandoffStarter = "patient" | "ai" | "system" | "staff";

export const HANDOFF_PATIENT_TEXT =
  "Tudo bem! Já avisei o responsável, e alguém da nossa equipe vai continuar o atendimento por aqui. 🙂";
export const HANDOFF_UNRESOLVED_TEXT =
  "Para não te deixar sem resposta, vou passar sua conversa para alguém da nossa equipe, que continua o atendimento por aqui.";

const REASON_LABEL: Record<HandoffReason, string> = {
  patient_request: "pediu para falar com uma pessoa",
  frustrated: "paciente insatisfeito ou irritado",
  out_of_scope: "assunto que o atendente automático não resolve",
  unresolved: "o atendente automático não conseguiu resolver",
  emergency: "emergência",
  staff: "assumida pela equipe",
  other: "outro motivo",
};

/** Últimas mensagens da conversa em texto, para o resumo enviado à equipe. */
export async function recentTranscript(db: Queryable, conversationId: string, limit = 8): Promise<string> {
  const { rows } = await db.query<{ direction: string; author: string | null; type: string; body: string | null }>(
    `select direction, author, type, body from (
       select direction, author, type, body, created_at, id from messages
       where conversation_id = $1 and (direction = 'inbound' or status in ('sent', 'delivered', 'read'))
       order by created_at desc, id desc limit $2
     ) recent order by created_at, id`,
    [conversationId, limit],
  );
  return rows
    .map((row) => {
      const who = row.direction === "inbound" ? "Paciente" : row.author === "staff" ? "Equipe" : "Atendente";
      const text = row.body?.trim() || `[${row.type}]`;
      return `${who}: ${text.length > 200 ? `${text.slice(0, 200)}…` : text}`;
    })
    .join("\n");
}

export interface StartHandoff {
  clinicId: string;
  conversationId: string;
  reason: HandoffReason;
  summary: string;
  startedBy: HandoffStarter;
  /** Mensagem do paciente que motivou: evita alerta repetido numa nova tentativa. */
  sourceMessageId: string | null;
  jobMaxAttempts: number;
  /** A equipe já sabe (ela mesma assumiu): não manda alerta. */
  notifyTeam?: boolean;
}

/**
 * Coloca a conversa em atendimento humano: o bot para de responder, as mensagens do paciente
 * passam a ser encaminhadas à recepção, e a equipe recebe o resumo. Idempotente.
 */
export async function startHandoff(db: Db, input: StartHandoff): Promise<{ started: boolean }> {
  const started = await db.transaction(async (tx) => {
    const updated = await tx.query(
      `update conversations set status = 'human', unresolved_count = 0, updated_at = now()
       where id = $1 and status = 'bot' returning id`,
      [input.conversationId],
    );
    if (updated.rows.length === 0) return false;
    await tx.query(
      `insert into handoffs (clinic_id, conversation_id, reason, summary, started_by) values ($1, $2, $3, $4, $5)`,
      [input.clinicId, input.conversationId, input.reason, input.summary.slice(0, 2000), input.startedBy],
    );
    return true;
  });

  if (started && input.notifyTeam !== false) {
    await createAlert(
      db,
      {
        clinicId: input.clinicId,
        conversationId: input.conversationId,
        kind: input.reason === "emergency" ? "emergency" : "human_requested",
        summary: `Motivo: ${REASON_LABEL[input.reason]}.\n${input.summary}`,
        sourceMessageId: input.sourceMessageId,
      },
      { maxAttempts: input.jobMaxAttempts },
    );
  }
  return { started };
}

/** Devolve a conversa ao atendente automático. */
export async function releaseHandoff(
  db: Db,
  conversationId: string,
  endedBy: "staff" | "timeout" | "cli",
): Promise<{ released: boolean }> {
  return db.transaction(async (tx) => {
    const updated = await tx.query(
      `update conversations set status = 'bot', unresolved_count = 0, updated_at = now()
       where id = $1 and status = 'human' returning id`,
      [conversationId],
    );
    await tx.query(`update handoffs set ended_at = now(), ended_by = $2 where conversation_id = $1 and ended_at is null`, [
      conversationId,
      endedBy,
    ]);
    return { released: updated.rows.length > 0 };
  });
}

/** Última atividade do atendimento humano aberto (mensagem da equipe, ou o início). */
export async function openHandoffActivity(db: Queryable, conversationId: string): Promise<Date | null> {
  const { rows } = await db.query<{ last_activity: Date }>(
    `select coalesce(last_staff_message_at, started_at) as last_activity
     from handoffs where conversation_id = $1 and ended_at is null`,
    [conversationId],
  );
  return rows[0] ? new Date(rows[0].last_activity) : null;
}

/**
 * Conta mais uma tentativa sem solução. Devolve true quando chega a 2: a conversa deve ir
 * para a equipe.
 */
export async function registerUnresolved(db: Queryable, conversationId: string): Promise<boolean> {
  const { rows } = await db.query<{ unresolved_count: number }>(
    `update conversations set unresolved_count = unresolved_count + 1 where id = $1 returning unresolved_count`,
    [conversationId],
  );
  return (rows[0]?.unresolved_count ?? 0) >= 2;
}

export async function resetUnresolved(db: Queryable, conversationId: string): Promise<void> {
  await db.query(`update conversations set unresolved_count = 0 where id = $1 and unresolved_count > 0`, [conversationId]);
}
