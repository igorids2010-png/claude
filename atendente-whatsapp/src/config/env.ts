import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  DATABASE_URL: z.url(),
  DATABASE_SSL: booleanFromString.default(true),
  DATABASE_SSL_CA: z.string().optional(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

  META_APP_SECRET: z.string().min(1),
  META_VERIFY_TOKEN: z.string().min(16, "use um token longo e aleatório (16+ caracteres)"),
  WHATSAPP_GRAPH_API_VERSION: z.string().regex(/^v\d+\.\d+$/, "formato esperado: v23.0"),
  WHATSAPP_API_BASE_URL: z.url().default("https://graph.facebook.com"),

  ENCRYPTION_KEY: z
    .string()
    .refine((value) => Buffer.from(value, "base64").length === 32, {
      message: "precisa ser 32 bytes em base64 (gere com: openssl rand -base64 32)",
    }),

  ANTHROPIC_API_KEY: z.string().min(1),
  /** Modelo do atendente. Padrão: o mais capaz da Anthropic. */
  AI_MODEL: z.string().default("claude-fable-5-1"),
  AI_EFFORT: z.enum(["low", "medium", "high", "xhigh", "max"]).default("high"),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(16_000),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(90_000),
  AI_SERVER_FALLBACKS: booleanFromString.default(true),
  AI_HISTORY_MAX_MESSAGES: z.coerce.number().int().positive().default(40),
  AI_HISTORY_MAX_CHARS: z.coerce.number().int().positive().default(20_000),
  AI_MAX_CALLS_PER_CONVERSATION_PER_HOUR: z.coerce.number().int().positive().default(30),
  AI_MAX_CALLS_PER_CLINIC_PER_DAY: z.coerce.number().int().positive().default(3000),

  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(4),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(1000),
  JOB_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  /** Precisa ser maior que o pior caso de um job (chamadas à IA com retentativas). */
  JOB_LOCK_TIMEOUT_MS: z.coerce.number().int().positive().default(10 * 60_000),
  MESSAGE_DEBOUNCE_MS: z.coerce.number().int().nonnegative().default(4000),
  MESSAGE_DEBOUNCE_MAX_MS: z.coerce.number().int().nonnegative().default(15_000),
  /** Mensagens mais antigas que isso (ex.: reentregues pela Meta depois de uma queda longa) são gravadas, mas não respondidas. */
  INBOUND_MAX_AGE_MS: z.coerce.number().int().positive().default(24 * 60 * 60 * 1000),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas ou ausentes:\n${problems}`);
  }
  return result.data;
}
