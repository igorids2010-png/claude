import { describe, expect, it } from "vitest";
import { parseWebhook } from "../../src/whatsapp/payload.js";
import { mediaMessage, reactionMessage, statusEvent, textMessage, webhookPayload } from "../helpers/payloads.js";

describe("parseWebhook", () => {
  it("extrai mensagem de texto com phone_number_id e horário", () => {
    const message = textMessage("Olá, quanto custa a sessão?", { timestamp: "1700000000" });
    const parsed = parseWebhook(webhookPayload({ messages: [message] }));
    expect(parsed?.messages).toEqual([
      expect.objectContaining({
        kind: "text",
        body: "Olá, quanto custa a sessão?",
        waMessageId: message.id,
        timestamp: new Date(1_700_000_000_000),
      }),
    ]);
  });

  it("classifica mídias, voz e reações", () => {
    const parsed = parseWebhook(
      webhookPayload({
        messages: [
          mediaMessage("audio"),
          mediaMessage("image"),
          mediaMessage("sticker"),
          { ...mediaMessage("audio"), type: "voice" },
          reactionMessage("wamid.x"),
          { ...textMessage("x"), type: "algo_novo_da_meta" },
        ],
      }),
    );
    expect(parsed?.messages.map((m) => m.kind)).toEqual(["audio", "image", "sticker", "audio", "reaction", "unsupported"]);
    expect(parsed?.messages.every((m) => m.body === null || m.kind === "unsupported")).toBe(true);
  });

  it("lê o título de respostas de botões", () => {
    const parsed = parseWebhook(
      webhookPayload({
        messages: [
          { ...textMessage(""), type: "interactive", text: undefined, interactive: { type: "button_reply", button_reply: { id: "confirmar", title: "Confirmar" } } },
          { ...textMessage(""), type: "button", text: undefined, button: { text: "Remarcar", payload: "REMARCAR" } },
        ],
      }),
    );
    expect(parsed?.messages.map((m) => [m.kind, m.body])).toEqual([
      ["interactive", "Confirmar"],
      ["button", "Remarcar"],
    ]);
  });

  it("extrai atualizações de status", () => {
    const parsed = parseWebhook(webhookPayload({ statuses: [statusEvent("wamid.OUT1", "failed", [{ code: 131047 }])] }));
    expect(parsed?.statuses).toEqual([
      expect.objectContaining({ waMessageId: "wamid.OUT1", status: "failed", errorCode: 131047 }),
    ]);
  });

  it("tolera campos novos e ignora mudanças que não são de mensagens", () => {
    const payload = webhookPayload({ messages: [textMessage("oi", { campo_novo: true })] });
    (payload.entry as Array<{ changes: unknown[] }>)[0]!.changes.push({ field: "account_update", value: { x: 1 } });
    const parsed = parseWebhook(payload);
    expect(parsed?.messages).toHaveLength(1);
  });

  it("devolve null para eventos que não são do WhatsApp", () => {
    expect(parseWebhook({ object: "page", entry: [] })).toBeNull();
    expect(parseWebhook({ foo: "bar" })).toBeNull();
  });

  it("conta mudanças malformadas sem derrubar as demais", () => {
    const payload = webhookPayload({ messages: [textMessage("oi")] });
    (payload.entry as Array<{ changes: unknown[] }>)[0]!.changes.push({ field: "messages", value: { sem: "metadata" } });
    const parsed = parseWebhook(payload);
    expect(parsed?.messages).toHaveLength(1);
    expect(parsed?.skipped).toBe(1);
  });
});
