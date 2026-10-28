export interface RetryOptions {
  /** Total de tentativas, incluindo a primeira. */
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Decide se o erro vale nova tentativa. */
  isRetryable: (error: unknown) => boolean;
  /** Atraso pedido pelo servidor (ex.: Retry-After), se houver. */
  retryAfterMs?: (error: unknown) => number | undefined;
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown }) => void;
  sleep?: (ms: number) => Promise<void>;
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Backoff exponencial com "full jitter": espera aleatória entre 0 e base * 2^n. */
export function backoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const ceiling = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
  return Math.round(Math.random() * ceiling);
}

export async function withRetry<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions): Promise<T> {
  const wait = options.sleep ?? sleep;
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt >= options.attempts || !options.isRetryable(error)) throw error;
      const requested = options.retryAfterMs?.(error);
      const delayMs = Math.min(
        options.maxDelayMs,
        requested ?? backoffDelay(attempt, options.baseDelayMs, options.maxDelayMs),
      );
      options.onRetry?.({ attempt, delayMs, error });
      await wait(delayMs);
    }
  }
}
