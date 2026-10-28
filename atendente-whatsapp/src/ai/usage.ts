import type { BetaMessage } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { Queryable } from "../db/db.js";

/** Grava os tokens de uma chamada. response.model é o modelo que de fato respondeu (pode ser o fallback). */
export async function recordUsage(db: Queryable, clinicId: string, conversationId: string, response: BetaMessage): Promise<void> {
  const usage = response.usage;
  await db.query(
    `insert into ai_usage (clinic_id, conversation_id, model, input_tokens, output_tokens,
                           cache_read_input_tokens, cache_creation_input_tokens, stop_reason)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      clinicId,
      conversationId,
      response.model,
      usage.input_tokens ?? 0,
      usage.output_tokens ?? 0,
      usage.cache_read_input_tokens ?? 0,
      usage.cache_creation_input_tokens ?? 0,
      response.stop_reason,
    ],
  );
}

export async function usageCounts(
  db: Queryable,
  clinicId: string,
  conversationId: string,
  timezone: string,
): Promise<{ conversationLastHour: number; clinicToday: number }> {
  const { rows } = await db.query<{ conversation_last_hour: number; clinic_today: number }>(
    `select
       (select count(*)::int from ai_usage
         where conversation_id = $2 and created_at > now() - interval '1 hour') as conversation_last_hour,
       (select count(*)::int from ai_usage
         where clinic_id = $1 and created_at >= date_trunc('day', now() at time zone $3) at time zone $3) as clinic_today`,
    [clinicId, conversationId, timezone],
  );
  return { conversationLastHour: rows[0]!.conversation_last_hour, clinicToday: rows[0]!.clinic_today };
}
