import { addDays } from "../lib/time.js";

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano). */
export function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Feriados nacionais (lei federal). Carnaval e Corpus Christi são ponto facultativo, e
 * feriados estaduais/municipais variam: a clínica cadastra esses em `holidays.dates`.
 */
export function nationalHolidays(year: number): Map<string, string> {
  const fixed: Array<[string, string]> = [
    ["01-01", "Confraternização Universal"],
    ["04-21", "Tiradentes"],
    ["05-01", "Dia do Trabalho"],
    ["09-07", "Independência do Brasil"],
    ["10-12", "Nossa Senhora Aparecida"],
    ["11-02", "Finados"],
    ["11-15", "Proclamação da República"],
    ["11-20", "Dia da Consciência Negra"],
    ["12-25", "Natal"],
  ];
  const holidays = new Map(fixed.map(([md, name]) => [`${year}-${md}`, name]));
  holidays.set(addDays(easterSunday(year), -2), "Sexta-feira Santa");
  return holidays;
}
