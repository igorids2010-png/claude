import type { Queryable } from "../db/db.js";

export const PROCESS_CONVERSATION = "process_conversation";

export interface Job {
  id: string;
  type: string;
  conversation_id: string | null;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
}

export interface DebounceOptions {
  /** Espera depois da última mensagem antes de responder (junta mensagens seguidas). */
  debounceMs: number;
  /** Teto da espera, contado a partir da primeira mensagem do lote. */
  debounceMaxMs: number;
  maxAttempts: number;
}

/**
 * Agenda o processamento da conversa. Se já existe um job pendente para ela, só
 * empurra o horário (debounce), sem passar do teto: um paciente que manda várias
 * mensagens seguidas recebe uma resposta só, mas nunca espera mais que debounceMaxMs.
 */
export async function enqueueConversationJob(
  db: Queryable,
  conversationId: string,
  options: DebounceOptions,
): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    `insert into jobs (type, conversation_id, run_at, max_attempts)
     values ($1, $2, now() + make_interval(secs => $3::double precision / 1000), $5)
     on conflict (type, conversation_id) where status = 'pending'
     do update set
       run_at = least(
         excluded.run_at,
         jobs.created_at + make_interval(secs => $4::double precision / 1000)
       ),
       updated_at = now()
     returning id`,
    [PROCESS_CONVERSATION, conversationId, options.debounceMs, options.debounceMaxMs, options.maxAttempts],
  );
  return rows[0]!.id;
}

/**
 * Pega até `limit` jobs prontos. Nunca pega um job de uma conversa que já tem outro
 * job rodando: as respostas de um mesmo paciente saem sempre em ordem.
 */
export async function claimJobs(db: Queryable, limit: number): Promise<Job[]> {
  const { rows } = await db.query<Job>(
    `with next as (
       select j.id
       from jobs j
       where j.status = 'pending'
         and j.run_at <= now()
         and (
           j.conversation_id is null
           or not exists (
             select 1 from jobs r
             where r.conversation_id = j.conversation_id and r.status = 'running'
           )
         )
       order by j.run_at
       limit $1
       for update skip locked
     )
     update jobs
     set status = 'running', locked_at = now(), attempts = jobs.attempts + 1, updated_at = now()
     from next
     where jobs.id = next.id
     returning jobs.id, jobs.type, jobs.conversation_id, jobs.payload, jobs.attempts, jobs.max_attempts`,
    [limit],
  );
  return rows;
}

export async function completeJob(db: Queryable, jobId: string): Promise<void> {
  await db.query(
    `update jobs set status = 'done', locked_at = null, updated_at = now() where id = $1`,
    [jobId],
  );
}

export type FailOutcome = "retry" | "failed" | "superseded";

/**
 * Registra a falha. Se ainda há tentativas, volta para a fila com atraso; se, enquanto
 * rodava, chegou mensagem nova e outro job pendente foi criado para a mesma conversa,
 * esse job novo já vai processar tudo, então este fica como "superseded".
 */
export async function failJob(
  db: Queryable,
  job: Job,
  error: string,
  options: { retryable: boolean; retryDelayMs: number },
): Promise<FailOutcome> {
  const giveUp = !options.retryable || job.attempts >= job.max_attempts;
  const { rows } = await db.query<{ status: FailOutcome | "pending" }>(
    `update jobs r
     set status = case
           when $3::boolean then 'failed'
           when exists (
             select 1 from jobs p
             where p.type = r.type and p.conversation_id = r.conversation_id and p.status = 'pending'
           ) then 'superseded'
           else 'pending'
         end,
         run_at = now() + make_interval(secs => $4::double precision / 1000),
         locked_at = null,
         last_error = $2,
         updated_at = now()
     where r.id = $1
     returning r.status`,
    [job.id, error.slice(0, 2000), giveUp, options.retryDelayMs],
  );
  const status = rows[0]?.status;
  return status === "pending" ? "retry" : (status ?? "failed");
}

/**
 * Jobs "running" há mais tempo que o limite pertencem a um worker que caiu (deploy,
 * crash). Eles voltam para a fila, ou falham de vez se já esgotaram as tentativas.
 */
export async function recoverStaleJobs(db: Queryable, lockTimeoutMs: number): Promise<number> {
  const { rows } = await db.query<{ id: string }>(
    `update jobs r
     set status = case
           when r.attempts >= r.max_attempts then 'failed'
           when exists (
             select 1 from jobs p
             where p.type = r.type and p.conversation_id = r.conversation_id and p.status = 'pending'
           ) then 'superseded'
           else 'pending'
         end,
         run_at = now(),
         locked_at = null,
         last_error = 'lock expirado: o worker parou no meio do job',
         updated_at = now()
     where r.status = 'running'
       and r.locked_at < now() - make_interval(secs => $1::double precision / 1000)
     returning r.id`,
    [lockTimeoutMs],
  );
  return rows.length;
}
