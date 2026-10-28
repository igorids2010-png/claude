import type { Logger } from "../lib/logger.js";
import { withRetry } from "../lib/retry.js";

/** Limite de caracteres de uma mensagem de texto no WhatsApp. */
export const MAX_TEXT_LENGTH = 4096;

/** Erros da Graph API que não adianta repetir (janela de 24h fechada, número inválido...). */
const NON_RETRYABLE_CODES = new Set([
  131047, // fora da janela de 24h: só template
  131026, // destinatário não consegue receber
  131051, // tipo de mensagem não suportado
  100, // parâmetro inválido
  190, // token expirado ou inválido
]);

/** Limites de taxa que a Meta às vezes devolve com HTTP 400: vale esperar e repetir. */
const RETRYABLE_CODES = new Set([
  4, // limite de chamadas do app
  80007, // limite da conta WhatsApp Business
  130429, // limite de vazão do número
  131056, // muitas mensagens para o mesmo destinatário em pouco tempo
]);

export class WhatsAppApiError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number | undefined,
    readonly code: number | undefined,
    readonly retryable: boolean,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "WhatsAppApiError";
  }
}

export interface WhatsAppClientOptions {
  baseUrl: string;
  graphApiVersion: string;
  fetch?: typeof fetch;
  logger: Logger;
  /** Tentativas por chamada (a fila ainda tenta de novo o job inteiro depois). */
  attempts?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export interface SendTarget {
  phoneNumberId: string;
  accessToken: string;
}

export interface WhatsAppClient {
  sendText(target: SendTarget, to: string, body: string): Promise<{ waMessageId: string }>;
  markAsRead(target: SendTarget, waMessageId: string): Promise<void>;
  /** Template aprovado na Meta: o único jeito de iniciar conversa fora da janela de 24h. */
  sendTemplate(
    target: SendTarget,
    to: string,
    template: { name: string; languageCode: string; bodyParams: string[] },
  ): Promise<{ waMessageId: string }>;
}

export function createWhatsAppClient(options: WhatsAppClientOptions): WhatsAppClient {
  const doFetch = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? 10_000;

  async function post(target: SendTarget, body: Record<string, unknown>): Promise<unknown> {
    const url = `${options.baseUrl}/${options.graphApiVersion}/${target.phoneNumberId}/messages`;
    return withRetry(
      async () => {
        let response: Response;
        try {
          response = await doFetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${target.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
            signal: AbortSignal.timeout(timeoutMs),
          });
        } catch (error) {
          // Rede ou timeout: vale tentar de novo.
          throw new WhatsAppApiError(`Falha de rede: ${(error as Error).message}`, undefined, undefined, true);
        }

        const json: unknown = await response.json().catch(() => null);
        if (response.ok) return json;

        const apiError = (json as { error?: { code?: number; message?: string } } | null)?.error;
        const code = apiError?.code;
        const retryAfter = Number(response.headers.get("retry-after"));
        const retryable =
          !(code !== undefined && NON_RETRYABLE_CODES.has(code)) &&
          (response.status === 429 || response.status >= 500 || (code !== undefined && RETRYABLE_CODES.has(code)));
        throw new WhatsAppApiError(
          `Graph API ${response.status}${code !== undefined ? ` (código ${code})` : ""}: ${apiError?.message ?? "sem detalhes"}`,
          response.status,
          code,
          retryable,
          Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : undefined,
        );
      },
      {
        attempts: options.attempts ?? 3,
        baseDelayMs: 500,
        maxDelayMs: 8000,
        isRetryable: (error) => error instanceof WhatsAppApiError && error.retryable,
        retryAfterMs: (error) => (error instanceof WhatsAppApiError ? error.retryAfterMs : undefined),
        onRetry: ({ attempt, delayMs, error }) =>
          options.logger.warn(
            { attempt, delayMs, err: (error as Error).message, phoneNumberId: target.phoneNumberId },
            "whatsapp: nova tentativa",
          ),
        ...(options.sleep ? { sleep: options.sleep } : {}),
      },
    );
  }

  function messageId(json: unknown): { waMessageId: string } {
    const waMessageId = (json as { messages?: Array<{ id?: string }> } | null)?.messages?.[0]?.id;
    if (!waMessageId) throw new WhatsAppApiError("Resposta da Graph API sem ID da mensagem", 200, undefined, false);
    return { waMessageId };
  }

  return {
    async sendText(target, to, body) {
      return messageId(
        await post(target, { recipient_type: "individual", to, type: "text", text: { preview_url: false, body } }),
      );
    },

    async sendTemplate(target, to, template) {
      return messageId(
        await post(target, {
          recipient_type: "individual",
          to,
          type: "template",
          template: {
            name: template.name,
            language: { code: template.languageCode },
            components: template.bodyParams.length
              ? [{ type: "body", parameters: template.bodyParams.map((text) => ({ type: "text", text })) }]
              : [],
          },
        }),
      );
    },

    async markAsRead(target, waMessageId) {
      await post(target, { status: "read", message_id: waMessageId });
    },
  };
}

/** Divide textos maiores que o limite do WhatsApp, preferindo quebrar em parágrafos e frases. */
export function splitText(text: string, limit = MAX_TEXT_LENGTH): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    const window = rest.slice(0, limit);
    let cut = Math.max(window.lastIndexOf("\n\n"), window.lastIndexOf("\n"));
    if (cut < limit * 0.5) cut = Math.max(window.lastIndexOf(". ") + 1, window.lastIndexOf(" "));
    if (cut <= 0) cut = limit;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}
