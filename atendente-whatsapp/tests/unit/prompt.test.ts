import { describe, expect, it } from "vitest";
import { buildSystemPrompt, buildTurnContext, formatBusinessHours } from "../../src/ai/prompt.js";
import type { ClinicProfile } from "../../src/clinics/profile.js";

const profile: ClinicProfile = {
  id: "c1",
  name: "Clínica Movimento",
  specialty: "fisioterapia",
  timezone: "America/Sao_Paulo",
  address: "Rua A, 10",
  mapsUrl: null,
  phone: null,
  cancellationPolicy: "Cancelar com 24h de antecedência.",
  paymentMethods: null,
  insuranceNotes: null,
  extraInfo: null,
  services: [
    { key: "avaliacao", name: "Avaliação", description: null, priceCents: 15000, priceNote: null, durationMinutes: 50 },
    { key: "pilates", name: "Pilates", description: "Turmas de até 3 pessoas", priceCents: null, priceNote: null, durationMinutes: 55 },
    { key: "pacote", name: "Pacote 10 sessões", description: null, priceCents: 99990, priceNote: "a partir de", durationMinutes: 50 },
  ],
  businessHours: [
    { weekday: 1, opensAt: "08:00", closesAt: "12:00" },
    { weekday: 1, opensAt: "13:00", closesAt: "18:00" },
    { weekday: 6, opensAt: "08:00", closesAt: "12:00" },
  ],
  insurancePlans: ["Unimed"],
};

describe("prompt de sistema", () => {
  const prompt = buildSystemPrompt(profile);

  it("traz os fatos da clínica com preço formatado em reais", () => {
    expect(prompt).toContain("Clínica Movimento");
    expect(prompt).toMatch(/Avaliação: R\$\s?150,00; duração de 50 min/);
    expect(prompt).toMatch(/Pacote 10 sessões: a partir de R\$\s?999,90/);
    expect(prompt).toContain("Turmas de até 3 pessoas");
    expect(prompt).toContain("Convênios aceitos: Unimed.");
    expect(prompt).toContain("Cancelar com 24h de antecedência.");
  });

  it("serviço sem preço aparece como valor não divulgado, nunca como zero", () => {
    expect(prompt).toContain("Pilates: valor não divulgado aqui (a equipe informa)");
    expect(prompt).not.toMatch(/Pilates: R\$/);
  });

  it("marca como 'não informado' o que a clínica não configurou", () => {
    expect(prompt).toMatch(/<formas_de_pagamento>\n\(não informado\)/);
  });

  it("contém as regras obrigatórias", () => {
    expect(prompt).toContain("SAMU (192)");
    expect(prompt).toContain("CVV (188");
    expect(prompt).toMatch(/Não dê diagnóstico/);
    expect(prompt).toMatch(/Nunca invente nem estime preço, horário, serviço/);
    expect(prompt).toMatch(/vai confirmar com a equipe/);
  });

  it("é determinístico (permite cache de prompt)", () => {
    expect(buildSystemPrompt(structuredClone(profile))).toBe(prompt);
  });

  it("clínica veterinária recebe orientação de emergência para animais", () => {
    expect(buildSystemPrompt({ ...profile, specialty: "veterinaria" })).toContain("pronto-atendimento veterinário 24h");
    expect(prompt).not.toContain("veterinário 24h");
  });

  it("clínica sem convênios diz que é só particular", () => {
    expect(buildSystemPrompt({ ...profile, insurancePlans: [] })).toContain("não atende por convênio");
  });
});

describe("horário de funcionamento", () => {
  it("lista de segunda a domingo, com dias fechados", () => {
    expect(formatBusinessHours(profile)).toBe(
      [
        "- Segunda: 08:00 às 12:00 e 13:00 às 18:00",
        "- Terça: fechado",
        "- Quarta: fechado",
        "- Quinta: fechado",
        "- Sexta: fechado",
        "- Sábado: 08:00 às 12:00",
        "- Domingo: fechado",
      ].join("\n"),
    );
  });
});

describe("contexto do turno", () => {
  it("mostra data e hora no fuso da clínica", () => {
    const text = buildTurnContext(new Date("2026-10-28T23:30:00Z"), "America/Sao_Paulo", { firstReply: false });
    expect(text).toContain("quarta-feira, 28 de outubro de 2026");
    expect(text).toContain("20:30");
  });

  it("avisa que a apresentação já foi enviada no primeiro contato", () => {
    expect(buildTurnContext(new Date(), "America/Sao_Paulo", { firstReply: true })).toContain("primeiro contato");
  });
});
