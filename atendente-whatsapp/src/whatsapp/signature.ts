import { createHmac, timingSafeEqual } from "node:crypto";

const PREFIX = "sha256=";

/**
 * Valida o cabeçalho X-Hub-Signature-256 enviado pela Meta: "sha256=" + HMAC-SHA256 do
 * corpo BRUTO da requisição, usando o App Secret como chave. O corpo precisa ser
 * exatamente os bytes recebidos (re-serializar o JSON muda o hash).
 */
export function isValidSignature(rawBody: Buffer, header: string | undefined, appSecret: string): boolean {
  if (!header?.startsWith(PREFIX)) return false;
  const received = header.slice(PREFIX.length);
  if (!/^[0-9a-f]{64}$/i.test(received)) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  // Comparação em tempo constante para não vazar o hash por diferença de tempo.
  return timingSafeEqual(expected, Buffer.from(received, "hex"));
}

/** Útil em testes e scripts para gerar um cabeçalho válido. */
export function signPayload(rawBody: Buffer | string, appSecret: string): string {
  return PREFIX + createHmac("sha256", appSecret).update(rawBody).digest("hex");
}
