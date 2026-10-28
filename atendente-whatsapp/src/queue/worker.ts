import type { Db } from "../db/db.js";
import type { Logger } from "../lib/logger.js";
import { claimJobs, completeJob, failJob, recoverStaleJobs, type Job } from "./jobs.js";

export type JobHandler = (job: Job) => Promise<void>;

/** Lance este erro (ou qualquer erro com `retryable: false`) quando repetir não adianta. */
export class PermanentJobError extends Error {
  readonly retryable = false;
  constructor(message: string) {
    super(message);
    this.name = "PermanentJobError";
  }
}

export interface WorkerOptions {
  db: Db;
  logger: Logger;
  handlers: Record<string, JobHandler>;
  concurrency: number;
  pollIntervalMs: number;
  lockTimeoutMs: number;
  /** Atraso de uma nova tentativa do job: 5s, 10s, 20s... até 10 min. */
  retryDelayMs?: (attempt: number) => number;
}

export interface Worker {
  start(): void;
  /** Para de pegar jobs e espera os que estão rodando terminarem. */
  stop(): Promise<void>;
  /** Processa uma rodada de jobs prontos e espera terminar (usado em testes). */
  runOnce(): Promise<number>;
}

const defaultRetryDelay = (attempt: number) => {
  const base = Math.min(10 * 60_000, 5000 * 2 ** (attempt - 1));
  return base + Math.round(Math.random() * base * 0.2);
};

export function createWorker(options: WorkerOptions): Worker {
  const { db, logger } = options;
  const retryDelayMs = options.retryDelayMs ?? defaultRetryDelay;
  const inFlight = new Set<Promise<void>>();
  let timer: NodeJS.Timeout | undefined;
  let running = false;
  let lastRecovery = 0;

  async function execute(job: Job): Promise<void> {
    const log = logger.child({ jobId: job.id, jobType: job.type, conversationId: job.conversation_id, attempt: job.attempts });
    const handler = options.handlers[job.type];
    try {
      if (!handler) throw new PermanentJobError(`Sem handler para o tipo de job "${job.type}"`);
      await handler(job);
      await completeJob(db, job.id);
      log.debug("job concluído");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryable = (error as { retryable?: boolean }).retryable !== false;
      const outcome = await failJob(db, job, message, {
        retryable,
        retryDelayMs: retryDelayMs(job.attempts),
      }).catch((dbError: unknown) => {
        log.error({ err: dbError }, "não foi possível registrar a falha do job");
        return "failed" as const;
      });
      const level = outcome === "failed" ? "error" : "warn";
      log[level]({ err: message, outcome }, "job falhou");
    }
  }

  async function poll(): Promise<number> {
    const now = Date.now();
    if (now - lastRecovery > options.lockTimeoutMs / 2) {
      lastRecovery = now;
      const recovered = await recoverStaleJobs(db, options.lockTimeoutMs);
      if (recovered > 0) logger.warn({ recovered }, "jobs travados devolvidos à fila");
    }

    const free = options.concurrency - inFlight.size;
    if (free <= 0) return 0;
    const jobs = await claimJobs(db, free);
    for (const job of jobs) {
      const promise = execute(job).finally(() => {
        inFlight.delete(promise);
        if (running) schedule(0);
      });
      inFlight.add(promise);
    }
    return jobs.length;
  }

  function schedule(delayMs: number) {
    if (!running) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      poll()
        .then((claimed) => schedule(claimed > 0 ? 0 : options.pollIntervalMs))
        .catch((error: unknown) => {
          logger.error({ err: error }, "erro ao buscar jobs");
          schedule(options.pollIntervalMs * 5);
        });
    }, delayMs);
  }

  return {
    start() {
      if (running) return;
      running = true;
      schedule(0);
      logger.info({ concurrency: options.concurrency }, "worker iniciado");
    },
    async stop() {
      running = false;
      clearTimeout(timer);
      await Promise.allSettled([...inFlight]);
      logger.info("worker parado");
    },
    async runOnce() {
      const claimed = await poll();
      await Promise.allSettled([...inFlight]);
      return claimed;
    },
  };
}
