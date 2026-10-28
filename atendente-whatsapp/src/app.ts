import Fastify, { LogController, type FastifyBaseLogger, type FastifyInstance } from "fastify";
import type { Db } from "./db/db.js";
import type { Logger } from "./lib/logger.js";
import { ingestWebhook, type IngestOptions } from "./conversations/ingest.js";
import { webhookRoutes } from "./http/webhook.js";

export interface AppDeps {
  db: Db;
  logger: Logger;
  appSecret: string;
  verifyToken: string;
  ingestOptions: IngestOptions;
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({
    loggerInstance: deps.logger as FastifyBaseLogger,
    // A URL de verificação traz o verify token na query: não logamos a query string.
    logController: new LogController({ disableRequestLogging: true }),
    trustProxy: true,
  });

  app.addHook("onResponse", async (request, reply) => {
    request.log.info(
      { method: request.method, path: request.routeOptions.url ?? "desconhecida", statusCode: reply.statusCode, ms: Math.round(reply.elapsedTime) },
      "requisição",
    );
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "erro não tratado");
    const status = (error as { statusCode?: number }).statusCode;
    reply.code(status && status >= 400 && status < 500 ? status : 500).send();
  });

  app.get("/health", async (_request, reply) => {
    try {
      await deps.db.query("select 1");
      return { status: "ok" };
    } catch {
      return reply.code(503).send({ status: "db_unavailable" });
    }
  });

  await app.register(webhookRoutes, {
    appSecret: deps.appSecret,
    verifyToken: deps.verifyToken,
    ingest: (parsed) => ingestWebhook(deps.db, parsed, deps.ingestOptions, deps.logger),
  });

  return app;
}
