import { createSign } from "node:crypto";
import { z } from "zod";
import type { Logger } from "../lib/logger.js";
import { withRetry } from "../lib/retry.js";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/calendar/v3";
const SCOPE = "https://www.googleapis.com/auth/calendar";

export const serviceAccountSchema = z.looseObject({
  client_email: z.email(),
  private_key: z.string().includes("PRIVATE KEY"),
});
export type ServiceAccount = z.infer<typeof serviceAccountSchema>;

/** Aceita o JSON da chave da conta de serviço puro ou em base64 (mais fácil de colar em painéis). */
export function parseServiceAccount(raw: string): ServiceAccount {
  const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  return serviceAccountSchema.parse(JSON.parse(text));
}

export class GoogleApiError extends Error {
  constructor(
    message: string,
    readonly status: number | undefined,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "GoogleApiError";
  }
}

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface CalendarEvent {
  /** ID definido por nós (base32hex): repetir a criação não duplica o evento. */
  id: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  timeZone: string;
}

export interface CalendarClient {
  /** Períodos ocupados de cada agenda. Lança erro se alguma agenda não estiver acessível. */
  freeBusy(calendarIds: string[], timeMin: Date, timeMax: Date): Promise<Map<string, BusyInterval[]>>;
  insertEvent(calendarId: string, event: CalendarEvent): Promise<void>;
  deleteEvent(calendarId: string, eventId: string): Promise<void>;
}

/** JWT assinado com a chave privada da conta de serviço (fluxo OAuth "jwt-bearer"). */
export function signServiceAccountJwt(account: ServiceAccount, nowSeconds: number): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "RS256", typ: "JWT" });
  const claims = encode({ iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: nowSeconds, exp: nowSeconds + 3600 });
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(account.private_key).toString("base64url");
  return `${header}.${claims}.${signature}`;
}

export function createGoogleCalendarClient(options: {
  serviceAccount: ServiceAccount;
  logger: Logger;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}): CalendarClient {
  const doFetch = options.fetch ?? fetch;
  let token: { value: string; expiresAt: number } | undefined;

  async function accessToken(): Promise<string> {
    if (token && token.expiresAt > Date.now() + 60_000) return token.value;
    const assertion = signServiceAccountJwt(options.serviceAccount, Math.floor(Date.now() / 1000));
    const response = await doFetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await response.json().catch(() => null)) as { access_token?: string; expires_in?: number; error_description?: string } | null;
    if (!response.ok || !json?.access_token) {
      throw new GoogleApiError(
        `Falha ao autenticar a conta de serviço do Google: ${json?.error_description ?? response.status}`,
        response.status,
        response.status >= 500,
      );
    }
    token = { value: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
    return token.value;
  }

  async function call(method: string, path: string, body?: unknown, okStatuses: number[] = []): Promise<unknown> {
    return withRetry(
      async () => {
        let response: Response;
        try {
          response = await doFetch(`${API}${path}`, {
            method,
            headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            signal: AbortSignal.timeout(10_000),
          });
        } catch (error) {
          if (error instanceof GoogleApiError) throw error;
          throw new GoogleApiError(`Falha de rede com o Google: ${(error as Error).message}`, undefined, true);
        }
        if (okStatuses.includes(response.status)) return null;
        const json: unknown = response.status === 204 ? null : await response.json().catch(() => null);
        if (response.ok) return json;
        if (response.status === 401) token = undefined;
        const message = (json as { error?: { message?: string } } | null)?.error?.message ?? "sem detalhes";
        throw new GoogleApiError(
          `Google Calendar ${response.status}: ${message}`,
          response.status,
          response.status === 429 || response.status >= 500 || response.status === 401,
        );
      },
      {
        attempts: 3,
        baseDelayMs: 500,
        maxDelayMs: 5000,
        isRetryable: (error) => error instanceof GoogleApiError && error.retryable,
        onRetry: ({ attempt, error }) => options.logger.warn({ attempt, err: (error as Error).message }, "google: nova tentativa"),
        ...(options.sleep ? { sleep: options.sleep } : {}),
      },
    );
  }

  return {
    async freeBusy(calendarIds, timeMin, timeMax) {
      const result = new Map<string, BusyInterval[]>();
      if (calendarIds.length === 0) return result;
      const json = (await call("POST", "/freeBusy", {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: calendarIds.map((id) => ({ id })),
      })) as { calendars?: Record<string, { busy?: Array<{ start: string; end: string }>; errors?: Array<{ reason?: string }> }> };

      for (const id of calendarIds) {
        const calendar = json.calendars?.[id];
        if (!calendar || calendar.errors?.length) {
          const reason = calendar?.errors?.[0]?.reason ?? "sem resposta";
          throw new GoogleApiError(
            `Agenda ${id} inacessível (${reason}). Confira se ela foi compartilhada com ${options.serviceAccount.client_email}.`,
            undefined,
            false,
          );
        }
        result.set(
          id,
          (calendar.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) })),
        );
      }
      return result;
    },

    async insertEvent(calendarId, event) {
      // 409 = já existe um evento com este ID (criação repetida numa nova tentativa): tudo certo.
      await call(
        "POST",
        `/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          id: event.id,
          summary: event.summary,
          description: event.description,
          start: { dateTime: event.start.toISOString(), timeZone: event.timeZone },
          end: { dateTime: event.end.toISOString(), timeZone: event.timeZone },
        },
        [409],
      );
    },

    async deleteEvent(calendarId, eventId) {
      // 404/410 = já não existe: o objetivo (não estar na agenda) foi atingido.
      await call("DELETE", `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, undefined, [404, 410]);
    },
  };
}

/** ID de evento do Google a partir do UUID do agendamento (hex é base32hex válido). */
export const eventIdFor = (appointmentId: string) => `apt${appointmentId.replace(/-/g, "")}`;
