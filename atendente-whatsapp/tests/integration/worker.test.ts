import { afterEach, describe, expect, it } from "vitest";
import { disclosureText, MEDIA_NOT_SUPPORTED_TEXT, PLACEHOLDER_REPLY_TEXT } from "../../src/conversations/texts.js";
import { claimJobs } from "../../src/queue/jobs.js";
import { ACCESS_TOKEN, PATIENT_WA_ID } from "../helpers/constants.js";
import { createHarness, type Harness } from "../helpers/harness.js";
import { mediaMessage, textMessage, webhookPayload } from "../helpers/payloads.js";

let h: Harness;
afterEach(async () => {
  await h?.close();
});

const DISCLOSURE = disclosureText("Clínica Teste");
const jobStatuses = async () =>
  (await h.db.query<{ status: string }>("select status from jobs order by created_at")).rows.map((r) => r.status);

describe("processamento assíncrono das conversas", () => {
  it("primeira mensagem: aviso de atendimento automatizado + resposta, e marca como lida", async () => {
    h = await createHarness();
    const message = textMessage("Oi, bom dia!");
    await h.postWebhook(webhookPayload({ messages: [message] }));
    expect(await h.worker.runOnce()).toBe(1);

    expect(h.graph.sentTexts()).toEqual([DISCLOSURE, PLACEHOLDER_REPLY_TEXT]);
    expect(h.graph.readReceipts()[0]?.body.message_id).toBe(message.id);
    expect(h.graph.calls.every((c) => c.token === `Bearer ${ACCESS_TOKEN}`)).toBe(true);
    expect(h.graph.calls.filter((c) => c.body.type === "text").every((c) => c.body.to === PATIENT_WA_ID)).toBe(true);
    expect(await jobStatuses()).toEqual(["done"]);

    const unhandled = await h.db.query("select 1 from messages where direction = 'inbound' and handled_at is null");
    expect(unhandled.rows).toHaveLength(0);
  });

  it("o aviso de atendimento automatizado sai uma vez só por conversa", async () => {
    h = await createHarness();
    await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }));
    await h.worker.runOnce();
    await h.postWebhook(webhookPayload({ messages: [textMessage("tudo bem?")] }));
    await h.worker.runOnce();
    expect(h.graph.sentTexts()).toEqual([DISCLOSURE, PLACEHOLDER_REPLY_TEXT, PLACEHOLDER_REPLY_TEXT]);
  });

  it.each(["audio", "image", "sticker", "video", "document"] as const)(
    "%s recebe a resposta educada de que só lemos texto",
    async (type) => {
      h = await createHarness();
      await h.postWebhook(webhookPayload({ messages: [mediaMessage(type)] }));
      await h.worker.runOnce();
      expect(h.graph.sentTexts()).toEqual([DISCLOSURE, MEDIA_NOT_SUPPORTED_TEXT]);
    },
  );

  it("mensagens seguidas recebem uma resposta só, com o aviso de mídia uma vez", async () => {
    const seen: string[][] = [];
    h = await createHarness({
      responder: {
        async reply(context) {
          seen.push(context.messages.map((m) => m.body ?? ""));
          return ["resposta única"];
        },
      },
    });
    await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }));
    await h.postWebhook(webhookPayload({ messages: [mediaMessage("audio"), mediaMessage("sticker")] }));
    await h.postWebhook(webhookPayload({ messages: [textMessage("queria marcar")] }));
    await h.worker.runOnce();

    expect(seen).toEqual([["oi", "queria marcar"]]);
    expect(h.graph.sentTexts()).toEqual([DISCLOSURE, MEDIA_NOT_SUPPORTED_TEXT, "resposta única"]);
  });

  it("respeita o debounce: o job só roda depois da espera", async () => {
    h = await createHarness({ debounceMs: 60_000 });
    await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }));
    expect(await h.worker.runOnce()).toBe(0);
    expect(h.graph.sentTexts()).toEqual([]);
  });

  it("o teto do debounce impede que mensagens contínuas adiem a resposta para sempre", async () => {
    h = await createHarness({ debounceMs: 60_000 });
    await h.postWebhook(webhookPayload({ messages: [textMessage("1")] }));
    // Simula que o lote começou há mais tempo que o teto (15s no harness).
    await h.db.query("update jobs set created_at = now() - interval '20 seconds'");
    await h.postWebhook(webhookPayload({ messages: [textMessage("2")] }));
    expect(await h.worker.runOnce()).toBe(1);
  });

  it("conversa em atendimento humano: bot fica em silêncio e a mensagem vai para a recepção", async () => {
    h = await createHarness();
    await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }));
    await h.db.query("update conversations set status = 'human'");
    await h.worker.runOnce();
    expect(h.graph.calls.filter((c) => c.body.to === PATIENT_WA_ID)).toHaveLength(0);
    expect(h.graph.calls.filter((c) => c.body.to === "5511900001111")).toHaveLength(1);
    const handled = await h.db.query("select 1 from messages where handled_at is not null");
    expect(handled.rows).toHaveLength(1);
  });

  it("falha temporária no envio: tenta de novo sem duplicar o que já saiu", async () => {
    h = await createHarness();
    await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }));
    // read ok, aviso ok, resposta falha 3x (as 3 tentativas do cliente) -> job volta para a fila.
    h.graph.queue(
      (c) => ({ status: 200, json: c.body.status === "read" ? { success: true } : {} }),
      () => ({ status: 200, json: { messages: [{ id: "wamid.DISCLOSURE" }] } }),
      h.graph.error(503),
      h.graph.error(503),
      h.graph.error(503),
    );
    await h.worker.runOnce();
    expect(await jobStatuses()).toEqual(["pending"]);

    await h.worker.runOnce();
    expect(await jobStatuses()).toEqual(["done"]);
    const sent = h.graph.sentTexts();
    expect(sent.filter((t) => t === DISCLOSURE)).toHaveLength(1);
    expect(sent.at(-1)).toBe(PLACEHOLDER_REPLY_TEXT);

    const outbound = await h.db.query<{ status: string }>(
      "select status from messages where direction = 'outbound' order by created_at",
    );
    expect(outbound.rows.map((r) => r.status)).toEqual(["sent", "sent"]);
  });

  it("erro permanente (janela de 24h fechada): job falha sem repetir", async () => {
    h = await createHarness();
    await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }));
    h.graph.queue((c) => ({ status: 200, json: { success: true, c: c.url } }), h.graph.error(400, 131047));
    await h.worker.runOnce();
    expect(await jobStatuses()).toEqual(["failed"]);
    expect(await h.worker.runOnce()).toBe(0);
  });

  it("desiste depois do número máximo de tentativas", async () => {
    h = await createHarness();
    await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }));
    for (let i = 0; i < 30; i++) h.graph.queue(h.graph.error(500));
    for (let i = 0; i < 5; i++) await h.worker.runOnce();
    expect(await jobStatuses()).toEqual(["failed"]);
    const job = await h.db.query<{ attempts: number }>("select attempts from jobs");
    expect(job.rows[0]!.attempts).toBe(3);
  });

  it("mensagem que chega durante o processamento gera novo job, sem corrida", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let calls = 0;
    h = await createHarness({
      responder: {
        async reply(context) {
          calls++;
          if (calls === 1) await gate;
          return [`resp ${context.messages.map((m) => m.body).join("+")}`];
        },
      },
    });
    await h.postWebhook(webhookPayload({ messages: [textMessage("a")] }));
    const firstRun = h.worker.runOnce();
    await new Promise((r) => setTimeout(r, 50));

    await h.postWebhook(webhookPayload({ messages: [textMessage("b")] }));
    // A conversa já tem job rodando: o novo job não pode ser pego em paralelo.
    expect(await claimJobs(h.db, 10)).toEqual([]);

    release();
    await firstRun;
    await h.worker.runOnce();
    const replies = h.graph.sentTexts().filter((t) => t.startsWith("resp"));
    expect(replies).toHaveLength(2);
    expect(replies[1]).toBe("resp b");
  });

  it("recupera job travado de um worker que caiu", async () => {
    h = await createHarness();
    await h.postWebhook(webhookPayload({ messages: [textMessage("oi")] }));
    await h.db.query(
      "update jobs set status = 'running', attempts = 1, locked_at = now() - interval '10 minutes'",
    );
    await h.worker.runOnce();
    expect(await jobStatuses()).toEqual(["done"]);
    expect(h.graph.sentTexts()).toContain(PLACEHOLDER_REPLY_TEXT);
  });

  it("isolamento entre clínicas: cada número responde com o token da sua clínica", async () => {
    h = await createHarness();
    const { upsertClinic } = await import("../../src/clinics/config.js");
    const { ENCRYPTION_KEY } = await import("../helpers/constants.js");
    await upsertClinic(
      h.db,
      { slug: "outra", name: "Outra Clínica", timezone: "America/Sao_Paulo", active: true, whatsapp: { phone_number_id: "222", access_token_env: "X" } },
      { accessToken: "token-outra", encryptionKey: ENCRYPTION_KEY },
    );
    await h.postWebhook(webhookPayload({ messages: [textMessage("oi")], phoneNumberId: "222" }));
    await h.worker.runOnce();
    const sends = h.graph.calls.filter((c) => c.body.type === "text");
    expect(sends.every((c) => c.url.includes("/222/messages") && c.token === "Bearer token-outra")).toBe(true);
    expect(h.graph.sentTexts()[0]).toBe(disclosureText("Outra Clínica"));
  });
});
