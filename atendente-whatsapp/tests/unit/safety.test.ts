import { describe, expect, it } from "vitest";
import { detectEmergency, emergencyText, replyCoversEmergency } from "../../src/ai/safety.js";

const human = { veterinary: false };
const vet = { veterinary: true };

describe("detecção de emergência", () => {
  it.each([
    "meu pai está com dor no peito",
    "minha mae DESMAIOU agora",
    "nao consigo respirar direito",
    "ela teve uma convulsão",
    "acho que é avc, a boca ficou torta",
    "tá sangrando muito o corte",
    "tomei remédio demais, overdose",
  ])("emergência médica: %s", (text) => {
    expect(detectEmergency(text, human)).toBe("medical");
  });

  it.each(["penso em me matar", "não quero mais viver", "to pensando em suicidio", "quero morrer"])(
    "risco de suicídio: %s",
    (text) => {
      expect(detectEmergency(text, human)).toBe("self_harm");
    },
  );

  it.each(["meu cachorro foi atropelado", "acho que a gata foi envenenada", "ele engoliu um osso"])(
    "emergência veterinária: %s",
    (text) => {
      expect(detectEmergency(text, vet)).toBe("animal");
    },
  );

  it.each([
    "estou com dor no ombro há 2 semanas",
    "quanto custa a avaliação?",
    "sinto um pouco de falta de ar quando corro, a fisio ajuda?",
    "queria marcar pilates",
    "meu joelho dói quando subo escada",
    "quero morrer de vergonha, esqueci a consulta",
  ])("não é emergência: %s", (text) => {
    expect(detectEmergency(text, human)).toBeNull();
  });
});

describe("cobertura da resposta", () => {
  it("emergência médica exige 192", () => {
    expect(replyCoversEmergency("Ligue para o SAMU (192) agora.", "medical")).toBe(true);
    expect(replyCoversEmergency("Procure um médico.", "medical")).toBe(false);
  });

  it("risco de suicídio aceita CVV 188 ou SAMU", () => {
    expect(replyCoversEmergency("Ligue para o CVV, 188.", "self_harm")).toBe(true);
  });

  it("os textos fixos cobrem o próprio caso", () => {
    for (const kind of ["medical", "self_harm", "animal"] as const) {
      expect(replyCoversEmergency(emergencyText(kind), kind)).toBe(true);
    }
  });
});
