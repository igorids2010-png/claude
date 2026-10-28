import { describe, expect, it } from "vitest";
import { clinicConfigSchema } from "../../src/clinics/config.js";

const base = {
  slug: "clinica-x",
  name: "Clínica X",
  whatsapp: { phone_number_id: "123", access_token_env: "X_TOKEN" },
};

describe("arquivo de configuração da clínica", () => {
  it("aceita a configuração mínima com padrões", () => {
    const config = clinicConfigSchema.parse(base);
    expect(config.timezone).toBe("America/Sao_Paulo");
    expect(config.services).toEqual([]);
    expect(config.insurance.accepted).toEqual([]);
  });

  it("valida intervalos de horário", () => {
    expect(clinicConfigSchema.safeParse({ ...base, business_hours: { mon: ["08:00-12:00"] } }).success).toBe(true);
    expect(clinicConfigSchema.safeParse({ ...base, business_hours: { mon: ["12:00-08:00"] } }).success).toBe(false);
    expect(clinicConfigSchema.safeParse({ ...base, business_hours: { mon: ["8h às 12h"] } }).success).toBe(false);
    expect(clinicConfigSchema.safeParse({ ...base, business_hours: { segunda: ["08:00-12:00"] } }).success).toBe(false);
  });

  it("recusa serviços com key repetida", () => {
    const service = { key: "a", name: "Serviço A", duration_minutes: 30 };
    expect(clinicConfigSchema.safeParse({ ...base, services: [service, service] }).success).toBe(false);
  });

  it("recusa campos desconhecidos (pega erro de digitação no YAML)", () => {
    expect(clinicConfigSchema.safeParse({ ...base, servicos: [] }).success).toBe(false);
  });

  it("valida o número da equipe", () => {
    expect(clinicConfigSchema.safeParse({ ...base, team: { alert_whatsapp: "(11) 99999-0000" } }).success).toBe(false);
    expect(clinicConfigSchema.safeParse({ ...base, team: { alert_whatsapp: "5511999990000" } }).success).toBe(true);
  });
});
