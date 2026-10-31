/**
 * Conversões entre horário local de uma clínica (fuso IANA) e UTC, sem dependências.
 * Datas locais são strings "YYYY-MM-DD"; horas locais, "HH:MM".
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

export interface LocalDateTime {
  date: string;
  time: string;
  /** 0 = domingo ... 6 = sábado */
  weekday: number;
  minutes: number;
}

export function toLocal(instant: Date, timeZone: string): LocalDateTime {
  const parts = Object.fromEntries(partsFormatter(timeZone).formatToParts(instant).map((p) => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;
  return { date, time, weekday: weekdayOf(date), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** Diferença (em minutos) entre o horário local e o UTC naquele instante. */
function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = Object.fromEntries(partsFormatter(timeZone).formatToParts(instant).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/** "2026-10-30" + "09:00" no fuso da clínica -> instante UTC. */
export function fromLocal(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = guess - offsetMinutes(new Date(guess), timeZone) * 60_000;
  const second = guess - offsetMinutes(new Date(first), timeZone) * 60_000;
  return new Date(second);
}

export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number) as [number, number];
  return h * 60 + m;
};

export const fromMinutes = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export const isValidDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;

const WEEKDAY_PT = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

/** "sexta-feira, 30/10" */
export function describeDate(date: string): string {
  const [, m, d] = date.split("-");
  return `${WEEKDAY_PT[weekdayOf(date)]}, ${d}/${m}`;
}
