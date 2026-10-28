import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import { buildApp } from "../../src/app.js";
import { upsertClinic } from "../../src/clinics/config.js";
import { createConversationProcessor } from "../../src/conversations/processor.js";
import { placeholderResponder, type Responder } from "../../src/conversations/responder.js";
import type { Db } from "../../src/db/db.js";
import { PROCESS_CONVERSATION } from "../../src/queue/jobs.js";
import { createWorker, type Worker } from "../../src/queue/worker.js";
import { createWhatsAppClient } from "../../src/whatsapp/client.js";
import { signPayload } from "../../src/whatsapp/signature.js";
import { ACCESS_TOKEN, APP_SECRET, ENCRYPTION_KEY, PHONE_NUMBER_ID, silentLogger, VERIFY_TOKEN } from "./constants.js";
import { getTestDb, resetTestDb } from "./db.js";
import { createFakeGraphApi } from "./graph-api.js";

export interface Harness {
  db: Db;
  app: FastifyInstance;
  worker: Worker;
  graph: ReturnType<typeof createFakeGraphApi>;
  clinicId: string;
  /** Envia um payload assinado ao webhook, como a Meta faria. */
  postWebhook(payload: unknown, options?: { signature?: string | null }): Promise<LightMyRequestResponse>;
  close(): Promise<void>;
}

export async function createHarness(options: { responder?: Responder; debounceMs?: number } = {}): Promise<Harness> {
  const db = await getTestDb();
  await resetTestDb(db);
  const graph = createFakeGraphApi();
  const { clinicId } = await upsertClinic(
    db,
    {
      slug: "clinica-teste",
      name: "Clínica Teste",
      timezone: "America/Sao_Paulo",
      active: true,
      whatsapp: { phone_number_id: PHONE_NUMBER_ID, access_token_env: "UNUSED" },
    },
    { accessToken: ACCESS_TOKEN, encryptionKey: ENCRYPTION_KEY },
  );

  const whatsapp = createWhatsAppClient({
    baseUrl: "https://graph.test",
    graphApiVersion: "v99.0",
    fetch: graph.fetch,
    logger: silentLogger,
    sleep: async () => undefined,
  });

  const worker = createWorker({
    db,
    logger: silentLogger,
    concurrency: 4,
    pollIntervalMs: 50,
    lockTimeoutMs: 60_000,
    retryDelayMs: () => 0,
    handlers: {
      [PROCESS_CONVERSATION]: createConversationProcessor({
        db,
        whatsapp,
        responder: options.responder ?? placeholderResponder,
        encryptionKey: ENCRYPTION_KEY,
        logger: silentLogger,
      }),
    },
  });

  const app = await buildApp({
    db,
    logger: silentLogger,
    appSecret: APP_SECRET,
    verifyToken: VERIFY_TOKEN,
    ingestOptions: {
      debounceMs: options.debounceMs ?? 0,
      debounceMaxMs: 15_000,
      maxAttempts: 3,
      inboundMaxAgeMs: 24 * 60 * 60 * 1000,
    },
  });

  return {
    db,
    app,
    worker,
    graph,
    clinicId,
    postWebhook(payload, postOptions = {}) {
      const body = JSON.stringify(payload);
      const signature = postOptions.signature === undefined ? signPayload(body, APP_SECRET) : postOptions.signature;
      return app.inject({
        method: "POST",
        url: "/webhook",
        headers: {
          "content-type": "application/json",
          ...(signature !== null ? { "x-hub-signature-256": signature } : {}),
        },
        payload: body,
      });
    },
    async close() {
      await worker.stop();
      await app.close();
    },
  };
}
