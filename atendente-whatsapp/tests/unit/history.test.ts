import { describe, expect, it } from "vitest";
import { toMessages } from "../../src/ai/history.js";

const inbound = (body: string | null, type = "text") => ({ direction: "inbound" as const, type, body });
const outbound = (body: string) => ({ direction: "outbound" as const, type: "text", body });

describe("histórico para a API", () => {
  it("alterna paciente e assistente, juntando mensagens seguidas", () => {
    expect(toMessages([inbound("oi"), inbound("tudo bem?"), outbound("Olá!"), inbound("quanto custa?")], 10_000)).toEqual([
      { role: "user", content: "oi\ntudo bem?" },
      { role: "assistant", content: "Olá!" },
      { role: "user", content: "quanto custa?" },
    ]);
  });

  it("descreve mídias e ignora reações", () => {
    expect(toMessages([inbound(null, "audio"), inbound(null, "reaction"), inbound("e aí?")], 10_000)).toEqual([
      { role: "user", content: "[o paciente enviou um áudio]\ne aí?" },
    ]);
  });

  it("começa e termina sempre no paciente", () => {
    const result = toMessages([outbound("aviso"), inbound("oi"), outbound("resposta pendente")], 10_000);
    expect(result).toEqual([{ role: "user", content: "oi" }]);
  });

  it("corta as mensagens mais antigas para caber no limite", () => {
    const rows = [inbound("a".repeat(50)), outbound("b".repeat(50)), inbound("c".repeat(50)), outbound("d".repeat(50)), inbound("e")];
    const result = toMessages(rows, 110);
    expect(result[0]).toEqual({ role: "user", content: "c".repeat(50) });
    expect(result.at(-1)).toEqual({ role: "user", content: "e" });
  });

  it("mensagem única gigante fica com o final", () => {
    const result = toMessages([inbound("x".repeat(100) + "FIM")], 50);
    expect(result[0]!.content).toHaveLength(50);
    expect(String(result[0]!.content).endsWith("FIM")).toBe(true);
  });

  it("histórico vazio quando não há mensagem do paciente", () => {
    expect(toMessages([outbound("só nós")], 1000)).toEqual([]);
  });
});
