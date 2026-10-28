import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { VERIFY_TOKEN } from "../helpers/constants.js";
import { createHarness, type Harness } from "../helpers/harness.js";
import { reactionMessage, statusEvent, textMessage, webhookPayload } from "../helpers/payloads.js";

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
});
afterEach(async () => {
  await h.close();
});

const count = async (table: string, where = "true") =>
  Number((await h.db.query<{ n: number }>(`select count(*)::int as n from ${table} where ${where}`)).rows[0]!.n);

describe("GET /webhook (verificação da Meta)", () => {
  const verify = (query: string) => h.app.inject({ method: "GET", url: `/webhook?${query}` });

  it("devolve o challenge quando o token confere", async () => {
    const res = await verify(`hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=1158201444`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("1158201444");
  });

  it.each([
    "hub.mode=subscribe&hub.verify_token=errado&hub.challenge=1",
    `hub.mode=unsubscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=1`,
    `hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}`,
    "",
  ])("recusa com 403: %s", async (query) => {
    expect((await verify(query)).statusCode).toBe(403);
  });
});

describe("POST /webhook", () => {
  it("recusa requisição sem assinatura", async () => {
    const res = await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }), { signature: null });
    expect(res.statusCode).toBe(401);
    expect(await count("messages")).toBe(0);
  });

  it("recusa assinatura inválida", async () => {
    const res = await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }), {
      signature: "sha256=" + "0".repeat(64),
    });
    expect(res.statusCode).toBe(401);
    expect(await count("messages")).toBe(0);
  });

  it("grava a mensagem, cria paciente, conversa e job, e responde 200", async () => {
    const res = await h.postWebhook(webhookPayload({ messages: [textMessage("Quero marcar uma avaliação")] }));
    expect(res.statusCode).toBe(200);
    expect(await count("patients")).toBe(1);
    expect(await count("conversations")).toBe(1);
    expect(await count("messages", "direction = 'inbound'")).toBe(1);
    expect(await count("jobs", "status = 'pending'")).toBe(1);
  });

  it("é idempotente: o mesmo evento entregue duas vezes gera uma mensagem só", async () => {
    const payload = webhookPayload({ messages: [textMessage("oi")] });
    expect((await h.postWebhook(payload)).statusCode).toBe(200);
    expect((await h.postWebhook(payload)).statusCode).toBe(200);
    expect(await count("messages")).toBe(1);
    expect(await count("jobs")).toBe(1);
  });

  it("idempotência também vale entre entregas com eventos diferentes no mesmo payload", async () => {
    const first = textMessage("um");
    await h.postWebhook(webhookPayload({ messages: [first] }));
    await h.postWebhook(webhookPayload({ messages: [first, textMessage("dois")] }));
    expect(await count("messages")).toBe(2);
  });

  it("junta mensagens seguidas num único job pendente (debounce)", async () => {
    await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }));
    await h.postWebhook(webhookPayload({ messages: [textMessage("queria marcar")] }));
    await h.postWebhook(webhookPayload({ messages: [textMessage("pra amanhã")] }));
    expect(await count("messages")).toBe(3);
    expect(await count("jobs")).toBe(1);
  });

  it("ignora (com 200) mensagens para números sem clínica", async () => {
    const res = await h.postWebhook(webhookPayload({ messages: [textMessage("oi")], phoneNumberId: "999" }));
    expect(res.statusCode).toBe(200);
    expect(await count("messages")).toBe(0);
  });

  it("não responde clínica desativada", async () => {
    await h.db.query("update clinics set active = false");
    await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }));
    expect(await count("messages")).toBe(0);
  });

  it("grava reações sem agendar resposta", async () => {
    await h.postWebhook(webhookPayload({ messages: [reactionMessage("wamid.qualquer")] }));
    expect(await count("messages", "handled_at is not null")).toBe(1);
    expect(await count("jobs")).toBe(0);
  });

  it("grava mensagens muito antigas sem responder", async () => {
    const twoDaysAgo = String(Math.floor(Date.now() / 1000) - 2 * 24 * 3600);
    await h.postWebhook(webhookPayload({ messages: [textMessage("antiga", { timestamp: twoDaysAgo })] }));
    expect(await count("messages")).toBe(1);
    expect(await count("jobs")).toBe(0);
  });

  it("confirma com 200 eventos assinados que não são de mensagens", async () => {
    const res = await h.postWebhook({ object: "page", entry: [] });
    expect(res.statusCode).toBe(200);
  });

  it("responde 400 para JSON inválido com assinatura válida", async () => {
    const { signPayload } = await import("../../src/whatsapp/signature.js");
    const res = await h.app.inject({
      method: "POST",
      url: "/webhook",
      headers: { "content-type": "application/json", "x-hub-signature-256": signPayload("{quebrado", "test-app-secret") },
      payload: "{quebrado",
    });
    expect(res.statusCode).toBe(400);
  });

  it("responde 500 quando o banco falha, para a Meta reenviar", async () => {
    const original = h.db.transaction;
    h.db.transaction = async () => {
      throw new Error("banco fora do ar");
    };
    const res = await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }));
    h.db.transaction = original;
    expect(res.statusCode).toBe(500);
  });

  it("atualiza status das mensagens enviadas sem regredir", async () => {
    await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }));
    await h.worker.runOnce();
    const { rows } = await h.db.query<{ wa_message_id: string }>(
      "select wa_message_id from messages where direction = 'outbound' order by created_at limit 1",
    );
    const id = rows[0]!.wa_message_id;

    await h.postWebhook(webhookPayload({ statuses: [statusEvent(id, "read")] }));
    await h.postWebhook(webhookPayload({ statuses: [statusEvent(id, "delivered")] })); // chegou atrasado
    const status = await h.db.query<{ status: string }>("select status from messages where wa_message_id = $1", [id]);
    expect(status.rows[0]!.status).toBe("read");
  });
});

describe("GET /health", () => {
  it("responde ok com banco disponível", async () => {
    const res = await h.app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });
});
