import { describe, expect, it } from "vitest";
import { createWhatsAppClient, WhatsAppApiError } from "../../src/whatsapp/client.js";
import { silentLogger } from "../helpers/constants.js";
import { createFakeGraphApi } from "../helpers/graph-api.js";

const target = { phoneNumberId: "123", accessToken: "token-abc" };

function setup() {
  const graph = createFakeGraphApi();
  const client = createWhatsAppClient({
    baseUrl: "https://graph.test",
    graphApiVersion: "v99.0",
    fetch: graph.fetch,
    logger: silentLogger,
    sleep: async () => undefined,
  });
  return { graph, client };
}

describe("cliente da WhatsApp Cloud API", () => {
  it("envia texto no formato da Graph API", async () => {
    const { graph, client } = setup();
    const result = await client.sendText(target, "5511999990000", "Olá!");
    expect(result.waMessageId).toBe("wamid.OUT1");
    expect(graph.calls[0]).toEqual({
      url: "https://graph.test/v99.0/123/messages",
      token: "Bearer token-abc",
      body: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "5511999990000",
        type: "text",
        text: { preview_url: false, body: "Olá!" },
      },
    });
  });

  it("marca mensagem como lida", async () => {
    const { graph, client } = setup();
    await client.markAsRead(target, "wamid.IN1");
    expect(graph.calls[0]?.body).toEqual({ messaging_product: "whatsapp", status: "read", message_id: "wamid.IN1" });
  });

  it("repete após erro 500 e 429", async () => {
    const { graph, client } = setup();
    graph.queue(graph.error(500), graph.error(429));
    await expect(client.sendText(target, "5511", "oi")).resolves.toEqual({ waMessageId: "wamid.OUT1" });
    expect(graph.calls).toHaveLength(3);
  });

  it("repete limite de vazão devolvido com HTTP 400", async () => {
    const { graph, client } = setup();
    graph.queue(graph.error(400, 130429));
    await client.sendText(target, "5511", "oi");
    expect(graph.calls).toHaveLength(2);
  });

  it("não repete quando a janela de 24h está fechada (131047)", async () => {
    const { graph, client } = setup();
    graph.queue(graph.error(400, 131047));
    const error = await client.sendText(target, "5511", "oi").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(WhatsAppApiError);
    expect(error).toMatchObject({ code: 131047, retryable: false, httpStatus: 400 });
    expect(graph.calls).toHaveLength(1);
  });

  it("não repete token inválido (401)", async () => {
    const { graph, client } = setup();
    graph.queue(graph.error(401, 190));
    await expect(client.sendText(target, "5511", "oi")).rejects.toMatchObject({ retryable: false });
    expect(graph.calls).toHaveLength(1);
  });

  it("desiste depois das tentativas e marca como recuperável", async () => {
    const { graph, client } = setup();
    graph.queue(graph.error(503), graph.error(503), graph.error(503));
    await expect(client.sendText(target, "5511", "oi")).rejects.toMatchObject({ retryable: true, httpStatus: 503 });
    expect(graph.calls).toHaveLength(3);
  });
});
