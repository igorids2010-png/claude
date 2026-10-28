import { describe, expect, it, vi } from "vitest";
import { decryptSecret, encryptSecret } from "../../src/lib/crypto.js";
import { withRetry } from "../../src/lib/retry.js";
import { splitText } from "../../src/whatsapp/client.js";
import { ENCRYPTION_KEY } from "../helpers/constants.js";

describe("criptografia de segredos", () => {
  it("criptografa e descriptografa", () => {
    const encrypted = encryptSecret("EAAG-token", ENCRYPTION_KEY);
    expect(encrypted).not.toContain("EAAG");
    expect(decryptSecret(encrypted, ENCRYPTION_KEY)).toBe("EAAG-token");
  });

  it("gera saídas diferentes para o mesmo texto (IV aleatório)", () => {
    expect(encryptSecret("a", ENCRYPTION_KEY)).not.toBe(encryptSecret("a", ENCRYPTION_KEY));
  });

  it("falha com chave errada ou texto adulterado", () => {
    const encrypted = encryptSecret("segredo", ENCRYPTION_KEY);
    expect(() => decryptSecret(encrypted, Buffer.alloc(32, 1).toString("base64"))).toThrow();
    const [v, iv, tag, data] = encrypted.split(":");
    const flipped = Buffer.from(data!, "base64");
    flipped[0] = flipped[0]! ^ 0xff;
    expect(() => decryptSecret([v, iv, tag, flipped.toString("base64")].join(":"), ENCRYPTION_KEY)).toThrow();
  });
});

describe("withRetry", () => {
  const sleep = vi.fn(async () => undefined);

  it("repete erros recuperáveis até dar certo", async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        if (++calls < 3) throw new Error("temporário");
        return "ok";
      },
      { attempts: 3, baseDelayMs: 10, maxDelayMs: 100, isRetryable: () => true, sleep },
    );
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("não repete erros permanentes", async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls++;
          throw new Error("permanente");
        },
        { attempts: 5, baseDelayMs: 10, maxDelayMs: 100, isRetryable: () => false, sleep },
      ),
    ).rejects.toThrow("permanente");
    expect(calls).toBe(1);
  });

  it("respeita o Retry-After, limitado ao máximo", async () => {
    const delays: number[] = [];
    await withRetry(
      async (attempt) => {
        if (attempt === 1) throw new Error("429");
        return true;
      },
      {
        attempts: 2,
        baseDelayMs: 10,
        maxDelayMs: 500,
        isRetryable: () => true,
        retryAfterMs: () => 10_000,
        onRetry: ({ delayMs }) => delays.push(delayMs),
        sleep,
      },
    );
    expect(delays).toEqual([500]);
  });
});

describe("splitText", () => {
  it("mantém textos curtos intactos", () => {
    expect(splitText("Olá!")).toEqual(["Olá!"]);
  });

  it("divide textos longos preferindo quebras de parágrafo", () => {
    const text = "a".repeat(60) + "\n\n" + "b".repeat(60);
    expect(splitText(text, 100)).toEqual(["a".repeat(60), "b".repeat(60)]);
  });

  it("nunca gera partes acima do limite", () => {
    const parts = splitText("palavra ".repeat(2000), 4096);
    expect(parts.every((part) => part.length <= 4096)).toBe(true);
    expect(parts.join(" ").split(" ").filter(Boolean)).toHaveLength(2000);
  });
});
