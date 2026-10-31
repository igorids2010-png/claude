import { describe, expect, it } from "vitest";
import { computeAvailability, type AvailabilityInput } from "../../src/scheduling/availability.js";
import { easterSunday, nationalHolidays } from "../../src/scheduling/holidays.js";
import { addDays, fromLocal, toLocal } from "../../src/lib/time.js";

const TZ = "America/Sao_Paulo";
// Quarta, 28/10/2026, 07:00 em São Paulo.
const NOW = fromLocal("2026-10-28", "07:00", TZ);

const ana = { id: "p-ana", key: "ana", name: "Dra. Ana", hours: null };
const joao = { id: "p-joao", key: "joao", name: "Dr. João", hours: null };

function input(overrides: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    timezone: TZ,
    now: NOW,
    fromDate: "2026-10-28",
    toDate: "2026-10-28",
    stepMinutes: 30,
    minAdvanceMinutes: 0,
    maxAdvanceDays: 60,
    durationMinutes: 50,
    intervalAfterMinutes: 0,
    clinicHours: [
      { weekday: 3, start: "08:00", end: "12:00" },
      { weekday: 3, start: "13:00", end: "15:00" },
    ],
    holidays: new Set(),
    professionals: [ana],
    busy: [],
    ...overrides,
  };
}
const times = (slots: ReturnType<typeof computeAvailability>) => slots.map((s) => s.time);

describe("horários livres", () => {
  it("respeita o expediente e o almoço; o atendimento termina até o fechamento", () => {
    expect(times(computeAvailability(input()))).toEqual(["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00"]);
  });

  it("converte para UTC corretamente (São Paulo = UTC-3)", () => {
    const [first] = computeAvailability(input());
    expect(first!.start.toISOString()).toBe("2026-10-28T11:00:00.000Z");
    expect(first!.end.toISOString()).toBe("2026-10-28T11:50:00.000Z");
  });

  it("não oferece horário que conflita com outro atendimento (incluindo o intervalo de preparo)", () => {
    const busy = [{ professionalId: "p-ana", start: fromLocal("2026-10-28", "09:00", TZ), end: fromLocal("2026-10-28", "10:00", TZ) }];
    const slots = times(computeAvailability(input({ busy, intervalAfterMinutes: 10 })));
    // 08:00-08:50 +10 = 09:00 encosta, ok; 08:30 invadiria; 09:00 e 09:30 ocupados.
    expect(slots.slice(0, 3)).toEqual(["08:00", "10:00", "10:30"]);
  });

  it("bloqueio da clínica (professionalId nulo) vale para todos", () => {
    const busy = [{ professionalId: null, start: fromLocal("2026-10-28", "08:00", TZ), end: fromLocal("2026-10-28", "12:00", TZ) }];
    const slots = computeAvailability(input({ busy, professionals: [ana, joao] }));
    expect(new Set(times(slots))).toEqual(new Set(["13:00", "13:30", "14:00"]));
  });

  it("ocupação de um profissional não afeta o outro", () => {
    const busy = [{ professionalId: "p-ana", start: fromLocal("2026-10-28", "08:00", TZ), end: fromLocal("2026-10-28", "15:00", TZ) }];
    const slots = computeAvailability(input({ busy, professionals: [ana, joao] }));
    expect(slots.every((s) => s.professionalKey === "joao")).toBe(true);
    expect(slots).toHaveLength(10);
  });

  it("horário do profissional é a interseção com o da clínica", () => {
    const partTime = { ...joao, hours: [{ weekday: 3, start: "10:00", end: "18:00" }] };
    expect(times(computeAvailability(input({ professionals: [partTime] })))).toEqual(["10:00", "10:30", "11:00", "13:00", "13:30", "14:00"]);
  });

  it("pula feriados e dias fechados", () => {
    const slots = computeAvailability(input({ fromDate: "2026-10-28", toDate: "2026-11-04", holidays: new Set(["2026-11-04"]) }));
    expect(new Set(slots.map((s) => s.date))).toEqual(new Set(["2026-10-28"]));
  });

  it("respeita a antecedência mínima", () => {
    const now = fromLocal("2026-10-28", "09:10", TZ);
    // 09:10 + 2h = 11:10. 11:00 é cedo demais e 11:30 terminaria depois das 12:00: o primeiro é 13:00.
    expect(times(computeAvailability(input({ now, minAdvanceMinutes: 120 })))[0]).toBe("13:00");
  });

  it("não oferece além do limite de dias à frente", () => {
    const slots = computeAvailability(input({ fromDate: "2026-10-28", toDate: "2027-01-31", maxAdvanceDays: 7 }));
    expect(slots.every((s) => s.date <= addDays("2026-10-28", 7))).toBe(true);
    expect(new Set(slots.map((s) => s.date))).toEqual(new Set(["2026-10-28", "2026-11-04"]));
  });

  it("não oferece datas no passado", () => {
    const slots = computeAvailability(input({ fromDate: "2026-10-01", toDate: "2026-10-28" }));
    expect(slots.every((s) => s.date >= "2026-10-28")).toBe(true);
  });

  it("filtra por período", () => {
    expect(times(computeAvailability(input({ period: "afternoon" })))).toEqual(["13:00", "13:30", "14:00"]);
    expect(times(computeAvailability(input({ period: "evening" })))).toEqual([]);
  });

  it("alinha à grade do step mesmo com expediente quebrado", () => {
    const clinicHours = [{ weekday: 3, start: "08:15", end: "10:00" }];
    expect(times(computeAvailability(input({ clinicHours, durationMinutes: 30 })))).toEqual(["08:30", "09:00", "09:30"]);
  });
});

describe("fuso horário", () => {
  it("ida e volta entre local e UTC", () => {
    const instant = fromLocal("2026-03-15", "23:30", TZ);
    expect(instant.toISOString()).toBe("2026-03-16T02:30:00.000Z");
    expect(toLocal(instant, TZ)).toMatchObject({ date: "2026-03-15", time: "23:30", weekday: 0 });
  });

  it("funciona em fusos com horário de verão (Lisboa)", () => {
    expect(fromLocal("2026-07-01", "10:00", "Europe/Lisbon").toISOString()).toBe("2026-07-01T09:00:00.000Z");
    expect(fromLocal("2026-12-01", "10:00", "Europe/Lisbon").toISOString()).toBe("2026-12-01T10:00:00.000Z");
  });
});

describe("feriados nacionais", () => {
  it.each([
    [2026, "2026-04-05"],
    [2027, "2027-03-28"],
    [2028, "2028-04-16"],
  ])("Páscoa de %i", (year, expected) => {
    expect(easterSunday(year)).toBe(expected);
  });

  it("inclui Sexta-feira Santa e Consciência Negra", () => {
    const holidays = nationalHolidays(2026);
    expect(holidays.get("2026-04-03")).toBe("Sexta-feira Santa");
    expect(holidays.get("2026-11-20")).toBe("Dia da Consciência Negra");
    expect(holidays.size).toBe(10);
  });
});
