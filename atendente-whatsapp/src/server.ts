import Anthropic from "@anthropic-ai/sdk";
import { createClaudeResponder } from "./ai/claude-responder.js";
import { buildApp } from "./app.js";
import { createProfileCache } from "./clinics/profile.js";
import { loadEnv } from "./config/env.js";
import { createConversationProcessor } from "./conversations/processor.js";
import { createPostgresDb } from "./db/db.js";
import { createLogger } from "./lib/logger.js";
import { DELIVER_STAFF_ALERT, PROCESS_CONVERSATION } from "./queue/jobs.js";
import { createWorker } from "./queue/worker.js";
import { createCalendarSyncHandler } from "./scheduling/calendar-sync.js";
import { createGoogleCalendarClient, parseServiceAccount } from "./scheduling/google-calendar.js";
import { SYNC_CALENDAR, type SchedulingDeps } from "./scheduling/service.js";
import { createAlertDeliveryHandler } from "./team/alerts.js";
import { createWhatsAppClient } from "./whatsapp/client.js";

const env = loadEnv();
const logger = createLogger({ level: env.LOG_LEVEL, pretty: env.NODE_ENV === "development" });

const db = createPostgresDb({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL,
  sslCa: env.DATABASE_SSL_CA,
  max: env.DATABASE_POOL_MAX,
});

const whatsapp = createWhatsAppClient({
  baseUrl: env.WHATSAPP_API_BASE_URL,
  graphApiVersion: env.WHATSAPP_GRAPH_API_VERSION,
  logger,
});

const calendar = env.GOOGLE_SERVICE_ACCOUNT_JSON
  ? createGoogleCalendarClient({ serviceAccount: parseServiceAccount(env.GOOGLE_SERVICE_ACCOUNT_JSON), logger })
  : null;
if (!calendar) logger.warn("GOOGLE_SERVICE_ACCOUNT_JSON não definida: agenda funciona só com o banco, sem Google Calendar");

const scheduling: SchedulingDeps = {
  db,
  calendar,
  logger,
  now: () => new Date(),
  holdMinutes: env.SCHEDULING_HOLD_MINUTES,
  jobMaxAttempts: env.JOB_MAX_ATTEMPTS,
};

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: env.AI_TIMEOUT_MS, maxRetries: 2 });

const responder = createClaudeResponder({
  db,
  logger,
  createMessage: (params) => anthropic.beta.messages.create(params),
  getProfile: createProfileCache(db),
  model: env.AI_MODEL,
  effort: env.AI_EFFORT,
  maxTokens: env.AI_MAX_TOKENS,
  serverFallbacks: env.AI_SERVER_FALLBACKS,
  history: { maxMessages: env.AI_HISTORY_MAX_MESSAGES, maxChars: env.AI_HISTORY_MAX_CHARS },
  maxCallsPerConversationPerHour: env.AI_MAX_CALLS_PER_CONVERSATION_PER_HOUR,
  maxCallsPerClinicPerDay: env.AI_MAX_CALLS_PER_CLINIC_PER_DAY,
  jobMaxAttempts: env.JOB_MAX_ATTEMPTS,
  scheduling,
});

const worker = createWorker({
  db,
  logger,
  concurrency: env.WORKER_CONCURRENCY,
  pollIntervalMs: env.WORKER_POLL_INTERVAL_MS,
  lockTimeoutMs: env.JOB_LOCK_TIMEOUT_MS,
  handlers: {
    [PROCESS_CONVERSATION]: createConversationProcessor({
      db,
      whatsapp,
      responder,
      encryptionKey: env.ENCRYPTION_KEY,
      logger,
    }),
    [DELIVER_STAFF_ALERT]: createAlertDeliveryHandler({ db, whatsapp, encryptionKey: env.ENCRYPTION_KEY, logger }),
    [SYNC_CALENDAR]: createCalendarSyncHandler({ db, calendar, logger }),
  },
});

const app = await buildApp({
  db,
  logger,
  appSecret: env.META_APP_SECRET,
  verifyToken: env.META_VERIFY_TOKEN,
  ingestOptions: {
    debounceMs: env.MESSAGE_DEBOUNCE_MS,
    debounceMaxMs: env.MESSAGE_DEBOUNCE_MAX_MS,
    maxAttempts: env.JOB_MAX_ATTEMPTS,
    inboundMaxAgeMs: env.INBOUND_MAX_AGE_MS,
  },
});

await app.listen({ host: env.HOST, port: env.PORT });
worker.start();

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "encerrando");
  const forceExit = setTimeout(() => process.exit(1), 25_000);
  forceExit.unref();
  try {
    await app.close();
    await worker.stop();
    await db.close();
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "erro ao encerrar");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
