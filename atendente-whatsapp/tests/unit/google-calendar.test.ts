import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createGoogleCalendarClient,
  eventIdFor,
  GoogleApiError,
  parseServiceAccount,
  signServiceAccountJwt,
} from "../../src/scheduling/google-calendar.js";
import { silentLogger } from "../helpers/constants.js";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const account = {
  client_email: "agenda@projeto.iam.gserviceaccount.com",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
};

describe("conta de serviço do Google", () => {
  it("assina o JWT com RS256 e as claims do fluxo jwt-bearer", () => {
    const jwt = signServiceAccountJwt(account, 1_800_000_000);
    const [header, claims, signature] = jwt.split(".");
    expect(JSON.parse(Buffer.from(header!, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    expect(JSON.parse(Buffer.from(claims!, "base64url").toString())).toEqual({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: 1_800_000_000,
      exp: 1_800_003_600,
    });
    const valid = createVerify("RSA-SHA256").update(`${header}.${claims}`).verify(publicKey, Buffer.from(signature!, "base64url"));
    expect(valid).toBe(true);
  });

  it("lê a chave em JSON puro ou em base64", () => {
    const json = JSON.stringify({ ...account, type: "service_account" });
    expect(parseServiceAccount(json).client_email).toBe(account.client_email);
    expect(parseServiceAccount(Buffer.from(json).toString("base64")).client_email).toBe(account.client_email);
    expect(() => parseServiceAccount('{"client_email":"x"}')).toThrow();
  });

  it("ID de evento é base32hex válido e estável", () => {
    const id = eventIdFor("0b5e7c1a-2d3f-4a5b-8c9d-0e1f2a3b4c5d");
    expect(id).toMatch(/^[a-v0-9]{5,1024}$/);
    expect(id).toBe(eventIdFor("0b5e7c1a-2d3f-4a5b-8c9d-0e1f2a3b4c5d"));
  });
});

function fakeGoogle(handlers: Record<string, (body: unknown) => { status: number; json?: unknown }>) {
  const calls: Array<{ method: string; url: string; body: unknown; auth: string | null }> = [];
  const fetchFn: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const raw = init?.body;
    const body = raw instanceof URLSearchParams ? Object.fromEntries(raw) : raw ? JSON.parse(String(raw)) : undefined;
    calls.push({ method, url, body, auth: new Headers(init?.headers).get("authorization") });
    if (url === "https://oauth2.googleapis.com/token") {
      return new Response(JSON.stringify({ access_token: "tok-1", expires_in: 3600 }), { status: 200 });
    }
    const key = `${method} ${url.replace("https://www.googleapis.com/calendar/v3", "")}`;
    const handler = handlers[key];
    if (!handler) return new Response("{}", { status: 500 });
    const { status, json } = handler(body);
    return new Response(json === undefined ? null : JSON.stringify(json), { status });
  };
  const client = createGoogleCalendarClient({ serviceAccount: account, logger: silentLogger, fetch: fetchFn, sleep: async () => undefined });
  return { client, calls };
}

describe("cliente do Google Calendar", () => {
  const start = new Date("2026-10-31T12:00:00Z");
  const end = new Date("2026-10-31T13:00:00Z");

  it("obtém token uma vez e consulta free/busy", async () => {
    const { client, calls } = fakeGoogle({
      "POST /freeBusy": () => ({
        status: 200,
        json: { calendars: { "ana@agenda": { busy: [{ start: "2026-10-31T12:00:00Z", end: "2026-10-31T12:30:00Z" }] } } },
      }),
    });
    const first = await client.freeBusy(["ana@agenda"], start, end);
    await client.freeBusy(["ana@agenda"], start, end);
    expect(first.get("ana@agenda")).toEqual([{ start: new Date("2026-10-31T12:00:00Z"), end: new Date("2026-10-31T12:30:00Z") }]);
    const tokenCalls = calls.filter((c) => c.url.includes("oauth2"));
    expect(tokenCalls).toHaveLength(1);
    expect(tokenCalls[0]!.body).toMatchObject({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer" });
    expect(calls.find((c) => c.url.endsWith("/freeBusy"))!.auth).toBe("Bearer tok-1");
  });

  it("agenda não compartilhada com a conta de serviço vira erro explicativo", async () => {
    const { client } = fakeGoogle({
      "POST /freeBusy": () => ({ status: 200, json: { calendars: { "ana@agenda": { errors: [{ reason: "notFound" }] } } } }),
    });
    const error = await client.freeBusy(["ana@agenda"], start, end).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GoogleApiError);
    expect((error as Error).message).toContain(account.client_email);
  });

  it("criação repetida (409) e exclusão de evento inexistente (404/410) não são erro", async () => {
    const { client, calls } = fakeGoogle({
      "POST /calendars/ana%40agenda/events": () => ({ status: 409, json: { error: { message: "duplicate" } } }),
      "DELETE /calendars/ana%40agenda/events/apt1": () => ({ status: 410 }),
    });
    await expect(
      client.insertEvent("ana@agenda", { id: "apt1", summary: "S", description: "D", start, end, timeZone: "America/Sao_Paulo" }),
    ).resolves.toBeUndefined();
    await expect(client.deleteEvent("ana@agenda", "apt1")).resolves.toBeUndefined();
    expect(calls.find((c) => c.method === "POST" && c.url.includes("/events"))!.body).toEqual({
      id: "apt1",
      summary: "S",
      description: "D",
      start: { dateTime: "2026-10-31T12:00:00.000Z", timeZone: "America/Sao_Paulo" },
      end: { dateTime: "2026-10-31T13:00:00.000Z", timeZone: "America/Sao_Paulo" },
    });
  });

  it("repete erros 5xx e desiste em 403", async () => {
    let attempts = 0;
    const { client } = fakeGoogle({
      "POST /freeBusy": () => (++attempts < 3 ? { status: 503 } : { status: 200, json: { calendars: { a: { busy: [] } } } }),
      "DELETE /calendars/a/events/x": () => ({ status: 403, json: { error: { message: "forbidden" } } }),
    });
    await expect(client.freeBusy(["a"], start, end)).resolves.toBeInstanceOf(Map);
    expect(attempts).toBe(3);
    await expect(client.deleteEvent("a", "x")).rejects.toMatchObject({ status: 403, retryable: false });
  });
});
