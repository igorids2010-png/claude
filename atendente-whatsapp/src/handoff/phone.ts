/**
 * No Brasil, o WhatsApp às vezes identifica celulares sem o nono dígito
 * ("551199990000" em vez de "5511999990000"). Comparamos sempre na forma sem ele.
 */
export function normalizeWaId(waId: string): string {
  const digits = waId.replace(/\D/g, "");
  const match = /^55(\d{2})9(\d{8})$/.exec(digits);
  return match ? `55${match[1]}${match[2]}` : digits;
}

export function sameWaId(a: string, b: string): boolean {
  return normalizeWaId(a) === normalizeWaId(b);
}
