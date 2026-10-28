import type { BetaMessage, MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { CreateMessage } from "../../src/ai/claude-responder.js";

type Block = Record<string, unknown>;
type Scripted = (params: MessageCreateParamsNonStreaming) => BetaMessage | Promise<BetaMessage>;

let ids = 0;

export function message(content: Block[], stopReason: string, extra: Partial<Record<string, unknown>> = {}): BetaMessage {
  return {
    id: `msg_${++ids}`,
    type: "message",
    role: "assistant",
    model: "claude-fable-5-1",
    content,
    stop_reason: stopReason,
    stop_sequence: null,
    stop_details: null,
    usage: { input_tokens: 1200, output_tokens: 80, cache_read_input_tokens: 1000, cache_creation_input_tokens: 0 },
    ...extra,
  } as unknown as BetaMessage;
}

/** Resposta final de texto (com um bloco de raciocínio vazio, como o Fable devolve por padrão). */
export const text = (body: string, extra: Partial<Record<string, unknown>> = {}) =>
  message([{ type: "thinking", thinking: "", signature: "sig" }, { type: "text", text: body }], "end_turn", extra);

/** Resposta pedindo para usar ferramentas. */
export const toolUse = (calls: Array<{ name: string; input: Record<string, unknown> }>, preamble?: string) =>
  message(
    [
      { type: "thinking", thinking: "", signature: "sig" },
      ...(preamble ? [{ type: "text", text: preamble }] : []),
      ...calls.map((call, index) => ({ type: "tool_use", id: `toolu_${++ids}_${index}`, name: call.name, input: call.input })),
    ],
    "tool_use",
  );

export const refusal = () =>
  message([], "refusal", { stop_details: { type: "refusal", category: "general_harms", explanation: null } });

export class FakeApiError extends Error {
  constructor(readonly status: number) {
    super(`erro ${status} simulado`);
  }
}

/** Claude falso: devolve as respostas programadas, em ordem, e guarda cada requisição. */
export function createFakeClaude() {
  const requests: MessageCreateParamsNonStreaming[] = [];
  const script: Scripted[] = [];
  const createMessage: CreateMessage = async (params) => {
    // Cópia profunda: o responder continua mexendo no array de mensagens depois.
    requests.push(structuredClone(params));
    const next = script.shift();
    if (!next) throw new Error("Claude falso sem resposta programada");
    return next(params);
  };
  return {
    createMessage,
    requests,
    respond: (...responses: Array<BetaMessage | Scripted>) =>
      script.push(...responses.map((r) => (typeof r === "function" ? r : () => r))),
    fail: (status = 529) =>
      script.push(() => {
        throw new FakeApiError(status);
      }),
    pending: () => script.length,
  };
}
