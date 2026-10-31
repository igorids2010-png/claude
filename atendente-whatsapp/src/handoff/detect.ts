/**
 * Pedido explícito de atendimento humano ("quero falar com uma atendente", "humano por favor").
 * Detectado antes da IA: a transferência acontece mesmo se a IA estiver fora do ar, e sem custo.
 * Casos menos diretos ficam com a IA (ferramenta transfer_to_human).
 */
const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const PERSON = "(atendente|humano|humana|pessoa|recepcao|recepcionista|secretaria|alguem da (equipe|clinica|recepcao)|alguem de verdade|uma pessoa de verdade|gente de verdade)";

const PATTERNS = [
  new RegExp(`^(oi |ola |por favor |pf |pfv )?(eu )?(quero|queria|gostaria de|preciso|posso|da pra|tem como|pode me passar para|me passa para|me passa pra|pode me passar pra|me transfere para|me transfere pra) (falar|conversar|ser atendid[oa]) (com|por) (o |a |um |uma )?${PERSON}`),
  new RegExp(`^(me )?(passa|transfere|chama) (para |pra )?(o |a |um |uma )?${PERSON}`),
  new RegExp(`^(um |uma )?${PERSON}( por favor| pf| pfv| agora)?$`),
  new RegExp(`^(falar|conversar) com (o |a |um |uma )?${PERSON}`),
];

export function detectHumanRequest(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized || /\bn(ao|em)\b/.test(normalized)) return false;
  return PATTERNS.some((pattern) => pattern.test(normalized));
}
