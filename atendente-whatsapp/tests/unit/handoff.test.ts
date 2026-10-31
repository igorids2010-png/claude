import { describe, expect, it } from "vitest";
import { detectHumanRequest } from "../../src/handoff/detect.js";
import { normalizeWaId, sameWaId } from "../../src/handoff/phone.js";
import { parseStaffCommand } from "../../src/handoff/staff.js";

describe("pedido explícito de atendente", () => {
  it.each([
    "quero falar com uma atendente",
    "Quero falar com um humano!",
    "queria falar com alguém da recepção",
    "gostaria de falar com uma pessoa",
    "posso falar com a secretária?",
    "atendente",
    "atendente por favor",
    "HUMANO",
    "me passa pra recepção",
    "oi, quero falar com atendente",
    "preciso falar com alguém de verdade",
    "falar com atendente",
  ])("detecta: %s", (text) => {
    expect(detectHumanRequest(text)).toBe(true);
  });

  it.each([
    "não quero falar com atendente, quero marcar",
    "a atendente foi muito simpática",
    "quero marcar uma avaliação",
    "qual o horário da recepção?",
    "vocês têm atendente no sábado?",
    "",
  ])("não detecta: %s", (text) => {
    expect(detectHumanRequest(text)).toBe(false);
  });
});

describe("números de WhatsApp", () => {
  it("compara números brasileiros com e sem o nono dígito", () => {
    expect(normalizeWaId("5511999990000")).toBe("551199990000");
    expect(sameWaId("5511999990000", "551199990000")).toBe(true);
    expect(sameWaId("+55 (11) 99999-0000", "5511999990000")).toBe(true);
    expect(sameWaId("5511999990000", "5511999990001")).toBe(false);
    expect(normalizeWaId("14155550100")).toBe("14155550100");
  });
});

describe("comandos da recepção", () => {
  it.each([
    ["#a3f9c Olá, aqui é a Júlia", { type: "relay", code: "A3F9C", text: "Olá, aqui é a Júlia" }],
    ["#A3F9C\nTexto em\nvárias linhas", { type: "relay", code: "A3F9C", text: "Texto em\nvárias linhas" }],
    ["#A3F9C /bot", { type: "release", code: "A3F9C" }],
    ["#a3f9c /BOT", { type: "release", code: "A3F9C" }],
    ["/bot A3F9C", { type: "release", code: "A3F9C" }],
    ["/bot #a3f9c", { type: "release", code: "A3F9C" }],
    ["#A3F9C /assumir", { type: "assume", code: "A3F9C" }],
    ["/assumir A3F9C", { type: "assume", code: "A3F9C" }],
    ["/lista", { type: "list" }],
    ["/ajuda", { type: "help" }],
    ["oi", { type: "help" }],
    ["#A3F9C", { type: "help" }],
    ["#XYZ12 olá", { type: "help" }],
  ])("%s", (body, expected) => {
    expect(parseStaffCommand(body)).toEqual(expected);
  });
});
