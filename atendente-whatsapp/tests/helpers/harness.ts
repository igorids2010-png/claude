import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import { buildApp } from "../../src/app.js";
import { upsertClinic } from "../../src/clinics/config.js";
import { createConversationProcessor } from "../../src/conversations/processor.js";
import { createClaudeResponder, type CreateMessage, type Effort } from "../../src/ai/claude-responder.js";
import type { ClinicConfigInput } from "../../src/clinics/config.js";
import { loadClinicProfile } from "../../src/clinics/profile.js";
import { placeholderResponder, type Responder } from "../../src/conversations/responder.js";
import type { Db } from "../../src/db/db.js";
import { DELIVER_STAFF_ALERT, PROCESS_CONVERSATION } from "../../src/queue/jobs.js";
import { createCalendarSyncHandler } from "../../src/scheduling/calendar-sync.js";
import type { CalendarClient } from "../../src/scheduling/google-calendar.js";
import { SYNC_CALENDAR, type SchedulingDeps } from "../../src/scheduling/service.js";
import { createStaffCommandHandler, STAFF_COMMAND } from "../../src/handoff/staff.js";
import { createAlertDeliveryHandler } from "../../src/team/alerts.js";
import { createWorker, type Worker } from "../../src/queue/worker.js";
import { createWhatsAppClient } from "../../src/whatsapp/client.js";
import { signPayload } from "../../src/whatsapp/signature.js";
import { ACCESS_TOKEN, APP_SECRET, ENCRYPTION_KEY, PHONE_NUMBER_ID, silentLogger, VERIFY_TOKEN } from "./constants.js";
import { getTestDb, resetTestDb } from "./db.js";
import { createFakeClaude } from "./fake-claude.js";
import { createFakeGraphApi } from "./graph-api.js";

export interface Harness {
  db: Db;
  app: FastifyInstance;
  worker: Worker;
  graph: ReturnType<typeof createFakeGraphApi>;
  claude: ReturnType<typeof createFakeClaude>;
  scheduling: SchedulingDeps;
  clinicId: string;
  /** Envia um payload assinado ao webhook, como a Meta faria. */
  postWebhook(payload: unknown, options?: { signature?: string | null }): Promise<LightMyRequestResponse>;
  close(): Promise<void>;
}

export const TEAM_WA_ID = "5511900001111";

/** Clínica de teste com a configuração completa usada pelo atendente. */
export const TEST_CLINIC: ClinicConfigInput = {
  slug: "clinica-teste",
  name: "Clínica Teste",
  specialty: "fisioterapia",
  timezone: "America/Sao_Paulo",
  address: "Rua das Flores, 100 - Centro, São Paulo - SP",
  phone: "(11) 3000-0000",
  whatsapp: { phone_number_id: PHONE_NUMBER_ID, access_token_env: "UNUSED" },
  team: { alert_whatsapp: TEAM_WA_ID },
  services: [
    { key: "avaliacao", name: "Avaliação fisioterapêutica", price: 150, duration_minutes: 50 },
    { key: "sessao", name: "Sessão de fisioterapia", price: 120, price_note: "a partir de", duration_minutes: 50 },
    { key: "pilates", name: "Pilates clínico", duration_minutes: 55 },
  ],
  business_hours: { mon: ["08:00-12:00", "13:00-19:00"], tue: ["08:00-19:00"], sat: ["08:00-12:00"] },
  insurance: { accepted: ["Unimed", "Bradesco Saúde"], notes: "Para outros planos, emitimos recibo para reembolso." },
  policies: { cancellation: "Cancelamentos com até 24h de antecedência, sem custo.", payment: "Pix, cartão e dinheiro." },
};

export interface HarnessOptions {
  /** "claude" usa o atendente de verdade com o Claude falso; o padrão é a resposta fixa da Fase 1. */
  responder?: Responder | "claude";
  debounceMs?: number;
  clinic?: Partial<ClinicConfigInput>;
  maxCallsPerConversationPerHour?: number;
  now?: () => Date;
  /** Chamada real à API (usada pela suíte de conversas em evals/). */
  createMessage?: CreateMessage;
  model?: string;
  effort?: Effort;
  handoffAutoReleaseMs?: number;
  /** Google Calendar falso (ou real); padrão: sem Google. */
  calendar?: CalendarClient | null;
}

export async function createHarness(options: HarnessOptions = {}): Promise<Harness> {
  const db = await getTestDb();
  await resetTestDb(db);
  const graph = createFakeGraphApi();
  const claude = createFakeClaude();
  const { clinicId } = await upsertClinic(
    db,
    { ...TEST_CLINIC, ...options.clinic },
    { accessToken: ACCESS_TOKEN, encryptionKey: ENCRYPTION_KEY },
  );

  const whatsapp = createWhatsAppClient({
    baseUrl: "https://graph.test",
    graphApiVersion: "v99.0",
    fetch: graph.fetch,
    logger: silentLogger,
    sleep: async () => undefined,
  });

  const scheduling: SchedulingDeps = {
    db,
    calendar: options.calendar ?? null,
    logger: silentLogger,
    now: options.now ?? (() => new Date()),
    holdMinutes: 20,
    jobMaxAttempts: 3,
  };

  const responder =
    options.responder === "claude"
      ? createClaudeResponder({
          db,
          logger: silentLogger,
          createMessage: options.createMessage ?? claude.createMessage,
          getProfile: (id) => loadClinicProfile(db, id),
          model: options.model ?? "claude-fable-5-1",
          effort: options.effort ?? "high",
          maxTokens: 16_000,
          serverFallbacks: true,
          history: { maxMessages: 40, maxChars: 20_000 },
          maxCallsPerConversationPerHour: options.maxCallsPerConversationPerHour ?? 30,
          maxCallsPerClinicPerDay: 3000,
          jobMaxAttempts: 3,
          scheduling,
          ...(options.now ? { now: options.now } : {}),
        })
      : (options.responder ?? placeholderResponder);

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
        responder,
        encryptionKey: ENCRYPTION_KEY,
        logger: silentLogger,
        handoffAutoReleaseMs: options.handoffAutoReleaseMs ?? 12 * 60 * 60 * 1000,
      }),
      [STAFF_COMMAND]: createStaffCommandHandler({ db, whatsapp, encryptionKey: ENCRYPTION_KEY, logger: silentLogger, jobMaxAttempts: 3 }),
      [DELIVER_STAFF_ALERT]: createAlertDeliveryHandler({ db, whatsapp, encryptionKey: ENCRYPTION_KEY, logger: silentLogger }),
      [SYNC_CALENDAR]: createCalendarSyncHandler({ db, calendar: options.calendar ?? null, logger: silentLogger }),
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
    claude,
    scheduling,
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
