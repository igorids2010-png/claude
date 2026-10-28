import { describe, expect, it } from "vitest";
import { isValidSignature, signPayload } from "../../src/whatsapp/signature.js";

const secret = "app-secret";
const body = Buffer.from(JSON.stringify({ object: "whatsapp_business_account", entry: [] }));

describe("assinatura X-Hub-Signature-256", () => {
  it("aceita a assinatura correta", () => {
    expect(isValidSignature(body, signPayload(body, secret), secret)).toBe(true);
  });

  it("aceita hex em maiúsculas", () => {
    const header = "sha256=" + signPayload(body, secret).slice(7).toUpperCase();
    expect(isValidSignature(body, header, secret)).toBe(true);
  });

  it("recusa quando o cabeçalho está ausente", () => {
    expect(isValidSignature(body, undefined, secret)).toBe(false);
  });

  it("recusa assinatura feita com outro segredo", () => {
    expect(isValidSignature(body, signPayload(body, "outro-segredo"), secret)).toBe(false);
  });

  it("recusa quando o corpo foi alterado", () => {
    const tampered = Buffer.from(body.toString().replace("[]", "[{}]"));
    expect(isValidSignature(tampered, signPayload(body, secret), secret)).toBe(false);
  });

  it("recusa corpo re-serializado com espaçamento diferente", () => {
    const reserialized = Buffer.from(JSON.stringify(JSON.parse(body.toString()), null, 2));
    expect(isValidSignature(reserialized, signPayload(body, secret), secret)).toBe(false);
  });

  it.each(["sha1=abc", "sha256=", "sha256=zz", "sha256=" + "a".repeat(63), signPayload(body, secret).slice(7)])(
    "recusa formato inválido: %s",
    (header) => {
      expect(isValidSignature(body, header, secret)).toBe(false);
    },
  );
});
