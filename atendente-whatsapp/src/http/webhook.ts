import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { isValidSignature } from "../whatsapp/signature.js";
import { parseWebhook, type ParsedWebhook } from "../whatsapp/payload.js";
import type { IngestResult } from "../conversations/ingest.js";

export interface WebhookRouteOptions {
  appSecret: string;
  verifyToken: string;
  ingest: (parsed: ParsedWebhook) => Promise<IngestResult>;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const webhookRoutes: FastifyPluginAsync<WebhookRouteOptions> = async (app: FastifyInstance, options) => {
  // Neste plugin o JSON chega como Buffer: a assinatura é calculada sobre os bytes exatos.
  app.addContentTypeParser("application/json", { parseAs: "buffer", bodyLimit: 1024 * 1024 }, (_req, body, done) =>
    done(null, body),
  );

  /** Verificação do webhook: a Meta chama uma vez ao configurar a URL no painel. */
  app.get<{ Querystring: Record<string, string | undefined> }>("/webhook", async (request, reply) => {
    const mode = request.query["hub.mode"];
    const token = request.query["hub.verify_token"];
    const challenge = request.query["hub.challenge"];
    if (mode === "subscribe" && token && challenge && safeEqual(token, options.verifyToken)) {
      return reply.code(200).type("text/plain").send(challenge);
    }
    request.log.warn("verificação de webhook recusada");
    return reply.code(403).send();
  });

  app.post("/webhook", async (request, reply) => {
    const rawBody = request.body;
    if (!Buffer.isBuffer(rawBody)) return reply.code(415).send();

    const signature = request.headers["x-hub-signature-256"];
    if (!isValidSignature(rawBody, typeof signature === "string" ? signature : undefined, options.appSecret)) {
      request.log.warn("assinatura do webhook inválida");
      return reply.code(401).send();
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return reply.code(400).send();
    }

    const parsed = parseWebhook(payload);
    if (!parsed) {
      // Assinado pela Meta, mas não é um evento de WhatsApp que tratamos: confirmamos para não haver reenvio.
      request.log.info("evento de webhook ignorado");
      return reply.code(200).send();
    }

    // Só respondemos 200 depois de gravar. Se o banco falhar, o 500 faz a Meta reenviar
    // o evento mais tarde, e a idempotência garante que nada seja duplicado.
    const result = await options.ingest(parsed);
    request.log.info({ ...result, skipped: parsed.skipped }, "webhook recebido");
    return reply.code(200).send();
  });
};
