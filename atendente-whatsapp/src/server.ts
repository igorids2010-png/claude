import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { createConversationProcessor } from "./conversations/processor.js";
import { placeholderResponder } from "./conversations/responder.js";
import { createPostgresDb } from "./db/db.js";
import { createLogger } from "./lib/logger.js";
import { PROCESS_CONVERSATION } from "./queue/jobs.js";
import { createWorker } from "./queue/worker.js";
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
      responder: placeholderResponder,
      encryptionKey: env.ENCRYPTION_KEY,
      logger,
    }),
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
