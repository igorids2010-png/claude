/**
 * Rede de segurança determinística para emergências. A IA é instruída a orientar o SAMU,
 * mas não dependemos só dela: se a mensagem tiver sinais claros de emergência e a resposta
 * não citar o 192 (ou se a IA estiver fora do ar), o sistema envia a orientação por conta própria.
 */

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const HUMAN_EMERGENCY = [
  /dor (forte |muito forte )?no peito/,
  /(nao|n) (consigo|to conseguindo|estou conseguindo) respirar/,
  /falta de ar (forte|muito forte|grave)/,
  /(desmai|desfaleceu|perdeu (a )?consciencia|inconsciente)/,
  /(convuls|ataque epileptico)/,
  /sangr\w* (muito|sem parar|demais)|hemorragia/,
  /\bavc\b|derrame|boca torta|rosto (caido|torto)/,
  /infarto|enfarte|parada cardiaca/,
  /overdose|envenen|intoxica/,
  /(garganta|lingua|rosto) (fechando|inchando muito)|anafila/,
  /(acidente|atropel|batida) (grave|feio)/,
];

const SELF_HARM = [
  /suicid/,
  /(me matar|tirar (a )?minha (propria )?vida|acabar com (a )?minha vida)/,
  /(quero|vou|penso em) morrer(?! de)/,
  /(me machucar|me cortar|me ferir)/,
  /nao (quero|aguento) mais viver/,
];

const ANIMAL_EMERGENCY = [
  /(atropel|envenen|intoxica|convuls|desmai|nao (esta|ta) respirando|sangrando muito|engoliu)/,
];

export type EmergencyKind = "medical" | "self_harm" | "animal" | null;

export function detectEmergency(text: string, options: { veterinary: boolean }): EmergencyKind {
  const normalized = normalize(text);
  if (SELF_HARM.some((pattern) => pattern.test(normalized))) return "self_harm";
  if (HUMAN_EMERGENCY.some((pattern) => pattern.test(normalized))) {
    return options.veterinary ? "animal" : "medical";
  }
  if (options.veterinary && ANIMAL_EMERGENCY.some((pattern) => pattern.test(normalized))) return "animal";
  return null;
}

export function emergencyText(kind: Exclude<EmergencyKind, null>): string {
  switch (kind) {
    case "self_harm":
      return (
        "Sinto muito que você esteja passando por isso. Você não está sozinho(a). " +
        "Ligue agora para o CVV no 188 (24h, gratuito) ou, se estiver em perigo imediato, para o SAMU no 192. " +
        "Já avisei a nossa equipe."
      );
    case "animal":
      return (
        "Isso parece uma emergência. Procure agora um pronto-atendimento veterinário 24h. " +
        "Se alguém estiver em risco, ligue para o SAMU (192). Já avisei a nossa equipe."
      );
    case "medical":
      return (
        "Isso pode ser uma emergência. Ligue agora para o SAMU (192) ou vá ao pronto-socorro mais próximo. " +
        "Já avisei a nossa equipe."
      );
  }
}

/** A resposta já orienta o serviço de emergência adequado? */
export function replyCoversEmergency(reply: string, kind: Exclude<EmergencyKind, null>): boolean {
  const normalized = normalize(reply);
  if (kind === "self_harm") return normalized.includes("188") || normalized.includes("192");
  if (kind === "animal") return normalized.includes("veterin") || normalized.includes("192");
  return normalized.includes("192");
}
