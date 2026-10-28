/** Graph API falsa: registra as chamadas e devolve respostas programadas. */
export interface GraphCall {
  url: string;
  token: string | null;
  body: Record<string, unknown>;
}

export type GraphResponder = (call: GraphCall) => { status: number; json: unknown; headers?: Record<string, string> };

export function createFakeGraphApi() {
  const calls: GraphCall[] = [];
  const queued: GraphResponder[] = [];
  let sent = 0;

  const ok: GraphResponder = (call) =>
    call.body.status === "read"
      ? { status: 200, json: { success: true } }
      : { status: 200, json: { messaging_product: "whatsapp", messages: [{ id: `wamid.OUT${++sent}` }] } };

  const fetch: typeof globalThis.fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    const call: GraphCall = {
      url: String(input),
      token: headers.get("authorization"),
      body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>,
    };
    calls.push(call);
    const responder = queued.shift() ?? ok;
    const response = responder(call);
    return new Response(JSON.stringify(response.json), {
      status: response.status,
      headers: { "content-type": "application/json", ...response.headers },
    });
  };

  return {
    fetch,
    calls,
    /** Só as mensagens enviadas (sem as marcações de leitura). */
    sentTexts: () =>
      calls.filter((call) => call.body.type === "text").map((call) => (call.body.text as { body: string }).body),
    readReceipts: () => calls.filter((call) => call.body.status === "read"),
    /** Programa as próximas respostas, na ordem. */
    queue: (...responders: GraphResponder[]) => queued.push(...responders),
    error: (status: number, code?: number): GraphResponder => () => ({
      status,
      json: { error: { message: "erro simulado", type: "OAuthException", ...(code !== undefined ? { code } : {}) } },
    }),
  };
}
