import { addDays, fromLocal, fromMinutes, toLocal, toMinutes, weekdayOf } from "../lib/time.js";

export interface TimeWindow {
  weekday: number;
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface Busy {
  /** null = vale para todos os profissionais (bloqueio da clínica). */
  professionalId: string | null;
  start: Date;
  end: Date;
}

export interface CandidateProfessional {
  id: string;
  key: string;
  name: string;
  /** null = segue o horário da clínica. */
  hours: TimeWindow[] | null;
}

export type Period = "any" | "morning" | "afternoon" | "evening";

export interface AvailabilityInput {
  timezone: string;
  now: Date;
  fromDate: string;
  toDate: string;
  stepMinutes: number;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  durationMinutes: number;
  intervalAfterMinutes: number;
  clinicHours: TimeWindow[];
  holidays: ReadonlySet<string>;
  professionals: CandidateProfessional[];
  busy: Busy[];
  period?: Period;
}

export interface Slot {
  professionalId: string;
  professionalKey: string;
  professionalName: string;
  date: string;
  time: string;
  start: Date;
  end: Date;
  /** Fim + intervalo de preparo: o trecho que o agendamento ocupa na agenda. */
  blockedUntil: Date;
}

const PERIOD_RANGE: Record<Period, [number, number]> = {
  any: [0, 24 * 60],
  morning: [0, 12 * 60],
  afternoon: [12 * 60, 18 * 60],
  evening: [18 * 60, 24 * 60],
};

/** Interseção de dois conjuntos de janelas do mesmo dia, em minutos. */
function intersect(a: Array<[number, number]>, b: Array<[number, number]>): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  for (const [aStart, aEnd] of a) {
    for (const [bStart, bEnd] of b) {
      const start = Math.max(aStart, bStart);
      const end = Math.min(aEnd, bEnd);
      if (start < end) result.push([start, end]);
    }
  }
  return result.sort((x, y) => x[0] - y[0]);
}

const windowsFor = (hours: TimeWindow[], weekday: number): Array<[number, number]> =>
  hours.filter((h) => h.weekday === weekday).map((h) => [toMinutes(h.start), toMinutes(h.end)]);

/**
 * Horários livres para um serviço. Regras: dentro do horário da clínica e do profissional,
 * fora de feriados e bloqueios, o atendimento termina até o fim do expediente, o intervalo de
 * preparo depois do atendimento não pode invadir o próximo, respeita a antecedência mínima e o
 * limite de dias à frente. Os horários seguem a grade de `stepMinutes` (ex.: 08:00, 08:30...).
 */
export function computeAvailability(input: AvailabilityInput): Slot[] {
  const today = toLocal(input.now, input.timezone).date;
  const lastDate = addDays(today, input.maxAdvanceDays);
  const earliest = input.now.getTime() + input.minAdvanceMinutes * 60_000;
  const [periodStart, periodEnd] = PERIOD_RANGE[input.period ?? "any"];
  const slots: Slot[] = [];

  for (let date = input.fromDate < today ? today : input.fromDate; date <= input.toDate && date <= lastDate; date = addDays(date, 1)) {
    if (input.holidays.has(date)) continue;
    const weekday = weekdayOf(date);
    const clinicWindows = windowsFor(input.clinicHours, weekday);
    if (clinicWindows.length === 0) continue;

    for (const professional of input.professionals) {
      const windows = professional.hours ? intersect(clinicWindows, windowsFor(professional.hours, weekday)) : clinicWindows;
      const busy = input.busy.filter((b) => b.professionalId === null || b.professionalId === professional.id);

      for (const [windowStart, windowEnd] of windows) {
        const firstSlot = Math.ceil(windowStart / input.stepMinutes) * input.stepMinutes;
        for (let minute = firstSlot; minute + input.durationMinutes <= windowEnd; minute += input.stepMinutes) {
          if (minute < periodStart || minute >= periodEnd) continue;
          const time = fromMinutes(minute);
          const start = fromLocal(date, time, input.timezone);
          if (start.getTime() < earliest) continue;
          const end = new Date(start.getTime() + input.durationMinutes * 60_000);
          const blockedUntil = new Date(end.getTime() + input.intervalAfterMinutes * 60_000);
          const overlaps = busy.some((b) => b.start < blockedUntil && start < b.end);
          if (overlaps) continue;
          slots.push({
            professionalId: professional.id,
            professionalKey: professional.key,
            professionalName: professional.name,
            date,
            time,
            start,
            end,
            blockedUntil,
          });
        }
      }
    }
  }
  return slots.sort((a, b) => a.start.getTime() - b.start.getTime() || a.professionalName.localeCompare(b.professionalName));
}
