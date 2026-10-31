import type { Db, Queryable } from "../db/db.js";
import { formatPrice } from "../ai/prompt.js";
import type { Logger } from "../lib/logger.js";
import { addDays, describeDate, fromLocal, isValidDate, toLocal } from "../lib/time.js";
import { enqueueJob } from "../queue/jobs.js";
import { computeAvailability, type Busy, type Period, type Slot, type TimeWindow } from "./availability.js";
import type { CalendarClient } from "./google-calendar.js";
import { nationalHolidays } from "./holidays.js";

export const SYNC_CALENDAR = "sync_calendar";

/** Erro "esperado" de agenda: a mensagem vai para a IA explicar ao paciente. */
export class SchedulingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchedulingError";
  }
}

export interface SchedulingDeps {
  db: Db;
  calendar: CalendarClient | null;
  logger: Logger;
  now: () => Date;
  /** Quanto tempo um horário proposto fica reservado esperando o "sim" do paciente. */
  holdMinutes: number;
  jobMaxAttempts: number;
}

export interface SchedulingContext {
  clinicId: string;
  conversationId: string;
  /** Mensagem do paciente sendo respondida agora. */
  sourceMessageId: string;
}

interface ServiceRow {
  id: string;
  key: string;
  name: string;
  durationMinutes: number;
  intervalAfterMinutes: number;
  priceCents: number | null;
  priceNote: string | null;
}

interface ProfessionalRow {
  id: string;
  key: string;
  name: string;
  calendarId: string | null;
  serviceIds: Set<string> | null;
  hours: TimeWindow[] | null;
}

interface ClinicSchedule {
  timezone: string;
  stepMinutes: number;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  nationalHolidays: boolean;
  customHolidays: Set<string>;
  clinicHours: TimeWindow[];
  services: Map<string, ServiceRow>;
  professionals: ProfessionalRow[];
}

const hhmm = (time: string) => time.slice(0, 5);

async function loadSchedule(db: Queryable, clinicId: string): Promise<ClinicSchedule> {
  const [clinic, hours, holidays, services, professionals, links, proHours] = await Promise.all([
    db.query<{ timezone: string; slot_step_minutes: number; min_advance_minutes: number; max_advance_days: number; national_holidays: boolean }>(
      `select timezone, slot_step_minutes, min_advance_minutes, max_advance_days, national_holidays from clinics where id = $1`,
      [clinicId],
    ),
    db.query<{ weekday: number; opens_at: string; closes_at: string }>(
      `select weekday, opens_at::text, closes_at::text from business_hours where clinic_id = $1`,
      [clinicId],
    ),
    db.query<{ date: string }>(`select to_char(date, 'YYYY-MM-DD') as date from holidays where clinic_id = $1`, [clinicId]),
    db.query<{ id: string; key: string; name: string; duration_minutes: number; interval_after_minutes: number; price_cents: number | null; price_note: string | null }>(
      `select id, key, name, duration_minutes, interval_after_minutes, price_cents, price_note
       from services where clinic_id = $1 and active`,
      [clinicId],
    ),
    db.query<{ id: string; key: string; name: string; google_calendar_id: string | null }>(
      `select id, key, name, google_calendar_id from professionals where clinic_id = $1 and active order by sort_order, name`,
      [clinicId],
    ),
    db.query<{ professional_id: string; service_id: string }>(
      `select ps.professional_id, ps.service_id from professional_services ps
       join professionals p on p.id = ps.professional_id where p.clinic_id = $1`,
      [clinicId],
    ),
    db.query<{ professional_id: string; weekday: number; starts_at: string; ends_at: string }>(
      `select ph.professional_id, ph.weekday, ph.starts_at::text, ph.ends_at::text from professional_hours ph
       join professionals p on p.id = ph.professional_id where p.clinic_id = $1`,
      [clinicId],
    ),
  ]);
  const settings = clinic.rows[0];
  if (!settings) throw new Error("Clínica não encontrada");

  return {
    timezone: settings.timezone,
    stepMinutes: settings.slot_step_minutes,
    minAdvanceMinutes: settings.min_advance_minutes,
    maxAdvanceDays: settings.max_advance_days,
    nationalHolidays: settings.national_holidays,
    customHolidays: new Set(holidays.rows.map((h) => h.date)),
    clinicHours: hours.rows.map((h) => ({ weekday: Number(h.weekday), start: hhmm(h.opens_at), end: hhmm(h.closes_at) })),
    services: new Map(
      services.rows.map((s) => [
        s.key,
        {
          id: s.id,
          key: s.key,
          name: s.name,
          durationMinutes: s.duration_minutes,
          intervalAfterMinutes: s.interval_after_minutes,
          priceCents: s.price_cents,
          priceNote: s.price_note,
        },
      ]),
    ),
    professionals: professionals.rows.map((p) => {
      const serviceIds = links.rows.filter((l) => l.professional_id === p.id).map((l) => l.service_id);
      const ownHours = proHours.rows.filter((h) => h.professional_id === p.id);
      return {
        id: p.id,
        key: p.key,
        name: p.name,
        calendarId: p.google_calendar_id,
        serviceIds: serviceIds.length ? new Set(serviceIds) : null,
        hours: ownHours.length
          ? ownHours.map((h) => ({ weekday: Number(h.weekday), start: hhmm(h.starts_at), end: hhmm(h.ends_at) }))
          : null,
      };
    }),
  };
}

function holidaySet(schedule: ClinicSchedule, fromDate: string, toDate: string): Set<string> {
  const set = new Set(schedule.customHolidays);
  if (schedule.nationalHolidays) {
    for (let year = Number(fromDate.slice(0, 4)); year <= Number(toDate.slice(0, 4)); year++) {
      for (const date of nationalHolidays(year).keys()) set.add(date);
    }
  }
  return set;
}

function findService(schedule: ClinicSchedule, key: string): ServiceRow {
  const service = schedule.services.get(key);
  if (!service) {
    throw new SchedulingError(`Serviço "${key}" não existe. Serviços: ${[...schedule.services.keys()].join(", ")}.`);
  }
  return service;
}

function candidatesFor(schedule: ClinicSchedule, service: ServiceRow, professionalKey: string | null): ProfessionalRow[] {
  const able = schedule.professionals.filter((p) => !p.serviceIds || p.serviceIds.has(service.id));
  if (!professionalKey) {
    if (able.length === 0) throw new SchedulingError(`Nenhum profissional atende "${service.name}".`);
    return able;
  }
  const chosen = able.find((p) => p.key === professionalKey);
  if (!chosen) {
    throw new SchedulingError(
      `O profissional "${professionalKey}" não atende "${service.name}". Opções: ${able.map((p) => `${p.key} (${p.name})`).join(", ") || "nenhuma"}.`,
    );
  }
  return [chosen];
}

interface SlotQuery {
  schedule: ClinicSchedule;
  service: ServiceRow;
  professionals: ProfessionalRow[];
  fromDate: string;
  toDate: string;
  period?: Period;
  /** Agendamento que está sendo remarcado: o horário dele não conta como ocupado. */
  ignoreAppointmentId?: string;
}

async function slotsFor(deps: SchedulingDeps, context: SchedulingContext, query: SlotQuery): Promise<Slot[]> {
  const { schedule } = query;
  const rangeStart = fromLocal(query.fromDate, "00:00", schedule.timezone);
  const rangeEnd = fromLocal(addDays(query.toDate, 1), "00:00", schedule.timezone);
  const ids = query.professionals.map((p) => p.id);
  const now = deps.now();

  const [appointments, blocks] = await Promise.all([
    deps.db.query<{ professional_id: string; starts_at: Date; blocked_until: Date }>(
      `select professional_id, starts_at, blocked_until from appointments
       where professional_id = any($1::uuid[])
         and status in ('held', 'scheduled')
         and not (status = 'held' and (hold_expires_at < $4 or conversation_id = $5))
         and id is distinct from $6
         and starts_at < $3 and blocked_until > $2`,
      [ids, rangeStart, rangeEnd, now, context.conversationId, query.ignoreAppointmentId ?? null],
    ),
    deps.db.query<{ professional_id: string | null; starts_at: Date; ends_at: Date }>(
      `select professional_id, starts_at, ends_at from schedule_blocks
       where clinic_id = $1 and (professional_id is null or professional_id = any($2::uuid[]))
         and starts_at < $4 and ends_at > $3`,
      [context.clinicId, ids, rangeStart, rangeEnd],
    ),
  ]);

  const busy: Busy[] = [
    ...appointments.rows.map((a) => ({ professionalId: a.professional_id, start: new Date(a.starts_at), end: new Date(a.blocked_until) })),
    ...blocks.rows.map((b) => ({ professionalId: b.professional_id, start: new Date(b.starts_at), end: new Date(b.ends_at) })),
  ];
  busy.push(...(await googleBusy(deps, query, rangeStart, rangeEnd)));

  return computeAvailability({
    timezone: schedule.timezone,
    now,
    fromDate: query.fromDate,
    toDate: query.toDate,
    stepMinutes: schedule.stepMinutes,
    minAdvanceMinutes: schedule.minAdvanceMinutes,
    maxAdvanceDays: schedule.maxAdvanceDays,
    durationMinutes: query.service.durationMinutes,
    intervalAfterMinutes: query.service.intervalAfterMinutes,
    clinicHours: schedule.clinicHours,
    holidays: holidaySet(schedule, query.fromDate, query.toDate),
    professionals: query.professionals.map((p) => ({ id: p.id, key: p.key, name: p.name, hours: p.hours })),
    busy,
    ...(query.period ? { period: query.period } : {}),
  });
}

/** Compromissos na agenda do Google de cada profissional (consultas particulares, folgas...). */
async function googleBusy(deps: SchedulingDeps, query: SlotQuery, rangeStart: Date, rangeEnd: Date): Promise<Busy[]> {
  const withCalendar = query.professionals.filter((p) => p.calendarId);
  if (withCalendar.length === 0 || !deps.calendar) return [];

  // O evento do agendamento sendo remarcado também aparece como ocupado no Google: descontamos.
  let ignored: { start: number; end: number } | null = null;
  if (query.ignoreAppointmentId) {
    const { rows } = await deps.db.query<{ starts_at: Date; ends_at: Date }>(
      `select starts_at, ends_at from appointments where id = $1`,
      [query.ignoreAppointmentId],
    );
    if (rows[0]) ignored = { start: new Date(rows[0].starts_at).getTime(), end: new Date(rows[0].ends_at).getTime() };
  }

  let byCalendar: Map<string, Array<{ start: Date; end: Date }>>;
  try {
    byCalendar = await deps.calendar.freeBusy(
      withCalendar.map((p) => p.calendarId!),
      rangeStart,
      rangeEnd,
    );
  } catch (error) {
    deps.logger.error({ err: (error as Error).message }, "não foi possível consultar o Google Calendar");
    throw new SchedulingError(
      "Não consegui consultar a agenda agora. Peça desculpas, diga que a equipe vai confirmar o horário e avise a equipe (scheduling_request).",
    );
  }
  return withCalendar.flatMap((p) =>
    (byCalendar.get(p.calendarId!) ?? [])
      .filter((b) => !(ignored && b.start.getTime() === ignored.start && b.end.getTime() === ignored.end))
      .map((b) => ({ professionalId: p.id, start: b.start, end: b.end })),
  );
}

async function patientIdOf(db: Queryable, conversationId: string): Promise<string> {
  const { rows } = await db.query<{ patient_id: string }>(`select patient_id from conversations where id = $1`, [conversationId]);
  if (!rows[0]) throw new Error("Conversa não encontrada");
  return rows[0].patient_id;
}

function parseLocalStart(start: string): { date: string; time: string } {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})$/.exec(start.trim());
  if (!match || !isValidDate(match[1]!)) throw new SchedulingError(`Horário inválido "${start}". Use o formato AAAA-MM-DDTHH:MM.`);
  return { date: match[1]!, time: match[2]! };
}

function priceText(service: ServiceRow): string | null {
  if (service.priceCents === null) return null;
  return [service.priceNote, formatPrice(service.priceCents)].filter(Boolean).join(" ");
}

const isExclusionViolation = (error: unknown) => (error as { code?: string }).code === "23P01";

// ---------------------------------------------------------------------------------------------
// Operações usadas pelas ferramentas da IA
// ---------------------------------------------------------------------------------------------

export async function checkAvailability(
  deps: SchedulingDeps,
  context: SchedulingContext,
  input: { serviceKey: string; dateFrom: string; dateTo: string | null; period: Period; professionalKey: string | null },
) {
  const schedule = await loadSchedule(deps.db, context.clinicId);
  const service = findService(schedule, input.serviceKey);
  const professionals = candidatesFor(schedule, service, input.professionalKey);
  if (!isValidDate(input.dateFrom)) throw new SchedulingError("date_from inválida (use AAAA-MM-DD).");
  const toDate = input.dateTo && isValidDate(input.dateTo) ? input.dateTo : addDays(input.dateFrom, 6);
  if (toDate < input.dateFrom) throw new SchedulingError("date_to é anterior a date_from.");
  const cappedTo = toDate > addDays(input.dateFrom, 13) ? addDays(input.dateFrom, 13) : toDate;

  const slots = await slotsFor(deps, context, { schedule, service, professionals, fromDate: input.dateFrom, toDate: cappedTo, period: input.period });

  const MAX_DAYS = 5;
  const MAX_TIMES_PER_DAY = 6;
  const days = new Map<string, Map<string, Array<{ key: string; name: string }>>>();
  for (const slot of slots) {
    let day = days.get(slot.date);
    if (!day) {
      if (days.size >= MAX_DAYS) break;
      day = new Map();
      days.set(slot.date, day);
    }
    let pros = day.get(slot.time);
    if (!pros) {
      if (day.size >= MAX_TIMES_PER_DAY) continue;
      pros = [];
      day.set(slot.time, pros);
    }
    pros.push({ key: slot.professionalKey, name: slot.professionalName });
  }

  return {
    service: { key: service.key, name: service.name, duration_minutes: service.durationMinutes, price: priceText(service) },
    searched: { from: input.dateFrom, to: cappedTo },
    available: [...days].map(([date, times]) => ({
      date,
      label: describeDate(date),
      times: [...times].map(([time, pros]) => ({ time, professionals: pros })),
    })),
    note:
      slots.length === 0
        ? "Nenhum horário livre nesse período. Ofereça procurar em outras datas."
        : "Mostre poucas opções por vez (até 3). Há mais horários além destes se precisar.",
  };
}

export async function listAppointments(deps: SchedulingDeps, context: SchedulingContext) {
  const patientId = await patientIdOf(deps.db, context.conversationId);
  const { rows } = await deps.db.query<{ id: string; starts_at: Date; service: string; professional: string; patient_name: string; timezone: string }>(
    `select a.id, a.starts_at, s.name as service, p.name as professional, a.patient_name, c.timezone
     from appointments a
     join services s on s.id = a.service_id
     join professionals p on p.id = a.professional_id
     join clinics c on c.id = a.clinic_id
     where a.clinic_id = $1 and a.patient_id = $2 and a.status = 'scheduled' and a.starts_at > $3
     order by a.starts_at
     limit 10`,
    [context.clinicId, patientId, deps.now()],
  );
  return {
    appointments: rows.map((r) => {
      const local = toLocal(new Date(r.starts_at), r.timezone);
      return {
        appointment_id: r.id,
        service: r.service,
        professional: r.professional,
        patient_name: r.patient_name,
        date: local.date,
        label: `${describeDate(local.date)} às ${local.time}`,
      };
    }),
  };
}

/** Descarta propostas anteriores desta conversa (o paciente mudou de ideia) e reservas vencidas. */
async function clearStale(tx: Queryable, context: SchedulingContext, now: Date): Promise<void> {
  await tx.query(
    `update appointments set status = 'expired', updated_at = now()
     where clinic_id = $1 and status = 'held' and (hold_expires_at < $2 or conversation_id = $3)`,
    [context.clinicId, now, context.conversationId],
  );
  await tx.query(
    `update pending_actions set status = 'superseded' where conversation_id = $1 and status = 'pending'`,
    [context.conversationId],
  );
}

async function requireSlot(
  deps: SchedulingDeps,
  context: SchedulingContext,
  schedule: ClinicSchedule,
  service: ServiceRow,
  professional: ProfessionalRow,
  start: string,
  ignoreAppointmentId?: string,
): Promise<Slot> {
  const { date, time } = parseLocalStart(start);
  const slots = await slotsFor(deps, context, {
    schedule,
    service,
    professionals: [professional],
    fromDate: date,
    toDate: date,
    ...(ignoreAppointmentId ? { ignoreAppointmentId } : {}),
  });
  const slot = slots.find((s) => s.time === time);
  if (!slot) {
    throw new SchedulingError(
      `${describeDate(date)} às ${time} não está disponível para ${professional.name}. Consulte check_availability e ofereça outros horários.`,
    );
  }
  return slot;
}

function describeSummary(value: { service: string; professional: string; when: string; patient_name: string }): string {
  return `${value.service} com ${value.professional}, ${value.when}, para ${value.patient_name}`;
}

function summary(service: ServiceRow, professional: { name: string }, slot: { date: string; time: string }, patientName: string) {
  return {
    service: service.name,
    professional: professional.name,
    when: `${describeDate(slot.date)} às ${slot.time}`,
    duration_minutes: service.durationMinutes,
    price: priceText(service),
    patient_name: patientName,
  };
}

export async function proposeBooking(
  deps: SchedulingDeps,
  context: SchedulingContext,
  input: { serviceKey: string; professionalKey: string; start: string; patientName: string },
) {
  const patientName = input.patientName.trim();
  if (patientName.length < 2) throw new SchedulingError("Pergunte o nome completo do paciente antes de propor o agendamento.");
  const schedule = await loadSchedule(deps.db, context.clinicId);
  const service = findService(schedule, input.serviceKey);
  const [professional] = candidatesFor(schedule, service, input.professionalKey);
  const slot = await requireSlot(deps, context, schedule, service, professional!, input.start);
  const now = deps.now();
  const expiresAt = new Date(now.getTime() + deps.holdMinutes * 60_000);
  const patientId = await patientIdOf(deps.db, context.conversationId);

  try {
    const actionId = await deps.db.transaction(async (tx) => {
      await clearStale(tx, context, now);
      const appointment = await tx.query<{ id: string }>(
        `insert into appointments (clinic_id, professional_id, service_id, patient_id, conversation_id, patient_name,
                                   starts_at, ends_at, blocked_until, status, hold_expires_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'held', $10)
         returning id`,
        [context.clinicId, slot.professionalId, service.id, patientId, context.conversationId, patientName, slot.start, slot.end, slot.blockedUntil, expiresAt],
      );
      const action = await tx.query<{ id: string }>(
        `insert into pending_actions (clinic_id, conversation_id, kind, appointment_id, payload, proposed_at_message_id, expires_at)
         values ($1, $2, 'book', $3, $4, $5, $6) returning id`,
        [
          context.clinicId,
          context.conversationId,
          appointment.rows[0]!.id,
          JSON.stringify({ summary: describeSummary(summary(service, professional!, slot, patientName)) }),
          context.sourceMessageId,
          expiresAt,
        ],
      );
      return action.rows[0]!.id;
    });
    return {
      action_id: actionId,
      summary: summary(service, professional!, slot, patientName),
      instructions:
        `Horário reservado por ${deps.holdMinutes} minutos, ainda NÃO confirmado. Mostre este resumo ao paciente e pergunte se pode confirmar. ` +
        "Só chame confirm_pending_action depois que ele responder que sim.",
    };
  } catch (error) {
    if (isExclusionViolation(error)) throw new SchedulingError("Esse horário acabou de ser ocupado. Ofereça outros horários.");
    throw error;
  }
}

interface OwnAppointment {
  id: string;
  professional_id: string;
  service_id: string;
  patient_name: string;
  starts_at: Date;
}

async function requireOwnAppointment(deps: SchedulingDeps, context: SchedulingContext, appointmentId: string): Promise<OwnAppointment> {
  const patientId = await patientIdOf(deps.db, context.conversationId);
  const { rows } = await deps.db.query<OwnAppointment>(
    `select id, professional_id, service_id, patient_name, starts_at from appointments
     where id::text = $1 and clinic_id = $2 and patient_id = $3 and status = 'scheduled' and starts_at > $4`,
    [appointmentId, context.clinicId, patientId, deps.now()],
  );
  if (!rows[0]) throw new SchedulingError("Agendamento não encontrado entre os próximos deste paciente. Use list_my_appointments.");
  return rows[0];
}

export async function proposeReschedule(
  deps: SchedulingDeps,
  context: SchedulingContext,
  input: { appointmentId: string; professionalKey: string | null; start: string },
) {
  const original = await requireOwnAppointment(deps, context, input.appointmentId);
  const schedule = await loadSchedule(deps.db, context.clinicId);
  const service = [...schedule.services.values()].find((s) => s.id === original.service_id);
  if (!service) throw new SchedulingError("O serviço deste agendamento não está mais disponível; avise a equipe.");
  const professionalKey = input.professionalKey ?? schedule.professionals.find((p) => p.id === original.professional_id)?.key ?? null;
  const [professional] = candidatesFor(schedule, service, professionalKey);
  const slot = await requireSlot(deps, context, schedule, service, professional!, input.start, original.id);
  const now = deps.now();

  const from = toLocal(new Date(original.starts_at), schedule.timezone);
  const proposedSummary = { ...summary(service, professional!, slot, original.patient_name), previous: `${describeDate(from.date)} às ${from.time}` };
  const actionId = await deps.db.transaction(async (tx) => {
    await clearStale(tx, context, now);
    const { rows } = await tx.query<{ id: string }>(
      `insert into pending_actions (clinic_id, conversation_id, kind, appointment_id, payload, proposed_at_message_id, expires_at)
       values ($1, $2, 'reschedule', $3, $4, $5, $6) returning id`,
      [
        context.clinicId,
        context.conversationId,
        original.id,
        JSON.stringify({
          professionalId: slot.professionalId,
          startsAt: slot.start.toISOString(),
          endsAt: slot.end.toISOString(),
          blockedUntil: slot.blockedUntil.toISOString(),
          summary: `de ${proposedSummary.previous} para ${describeSummary(proposedSummary)}`,
        }),
        context.sourceMessageId,
        new Date(now.getTime() + deps.holdMinutes * 60_000),
      ],
    );
    return rows[0]!.id;
  });
  return {
    action_id: actionId,
    summary: proposedSummary,
    instructions: "Remarcação ainda NÃO feita. Mostre o resumo (de quando para quando) e só chame confirm_pending_action depois do sim do paciente.",
  };
}

export async function proposeCancellation(deps: SchedulingDeps, context: SchedulingContext, input: { appointmentId: string }) {
  const appointment = await requireOwnAppointment(deps, context, input.appointmentId);
  const listed = (await listAppointments(deps, context)).appointments.find((a) => a.appointment_id === appointment.id);
  const now = deps.now();
  const actionId = await deps.db.transaction(async (tx) => {
    await clearStale(tx, context, now);
    const { rows } = await tx.query<{ id: string }>(
      `insert into pending_actions (clinic_id, conversation_id, kind, appointment_id, payload, proposed_at_message_id, expires_at)
       values ($1, $2, 'cancel', $3, $4, $5, $6) returning id`,
      [
        context.clinicId,
        context.conversationId,
        appointment.id,
        JSON.stringify({ summary: listed ? `${listed.service} com ${listed.professional}, ${listed.label}, para ${listed.patient_name}` : "consulta" }),
        context.sourceMessageId,
        new Date(now.getTime() + deps.holdMinutes * 60_000),
      ],
    );
    return rows[0]!.id;
  });
  return {
    action_id: actionId,
    appointment: listed,
    instructions:
      "Cancelamento ainda NÃO feito. Confirme com o paciente qual consulta será cancelada (lembre a política de cancelamento se houver) " +
      "e só chame confirm_pending_action depois do sim.",
  };
}

const KIND_LABEL = { book: "agendar", reschedule: "remarcar", cancel: "cancelar" } as const;

/**
 * Propostas desta conversa esperando o "sim" do paciente. Entram na mensagem de sistema de
 * cada turno, porque o histórico guarda só o texto da conversa (sem os resultados das ferramentas).
 */
export async function pendingActionsFor(deps: SchedulingDeps, conversationId: string): Promise<string[]> {
  const { rows } = await deps.db.query<{ id: string; kind: keyof typeof KIND_LABEL; payload: { summary?: string } }>(
    `select id, kind, payload from pending_actions
     where conversation_id = $1 and status = 'pending' and expires_at > $2
     order by created_at desc limit 3`,
    [conversationId, deps.now()],
  );
  return rows.map(
    (r) => `Proposta aguardando resposta do paciente: ${KIND_LABEL[r.kind]} ${r.payload.summary ?? ""} (action_id: ${r.id}).`,
  );
}

export async function confirmPendingAction(deps: SchedulingDeps, context: SchedulingContext, input: { actionId: string }) {
  const { rows } = await deps.db.query<{
    id: string;
    kind: "book" | "reschedule" | "cancel";
    appointment_id: string;
    payload: { professionalId?: string; startsAt?: string; endsAt?: string; blockedUntil?: string };
    proposed_at_message_id: string;
    expires_at: Date;
  }>(
    `select id, kind, appointment_id, payload, proposed_at_message_id, expires_at from pending_actions
     where id::text = $1 and conversation_id = $2 and status = 'pending'`,
    [input.actionId, context.conversationId],
  );
  const action = rows[0];
  if (!action) throw new SchedulingError("Proposta não encontrada ou já usada. Faça uma nova proposta ao paciente.");

  // A confirmação precisa vir de uma resposta do paciente à proposta, nunca do mesmo turno.
  if (action.proposed_at_message_id === context.sourceMessageId) {
    throw new SchedulingError(
      "O paciente ainda não respondeu a esta proposta. Mostre o resumo, pergunte se pode confirmar e espere a resposta dele.",
    );
  }
  const now = deps.now();
  if (new Date(action.expires_at) < now) {
    await deps.db.query(`update pending_actions set status = 'expired' where id = $1`, [action.id]);
    throw new SchedulingError("A proposta expirou. Verifique a disponibilidade de novo e faça uma nova proposta.");
  }

  if (action.kind === "book") return confirmBooking(deps, context, action.id, action.appointment_id, now);
  if (action.kind === "reschedule") return confirmReschedule(deps, context, action.id, action.appointment_id, action.payload);
  return confirmCancellation(deps, context, action.id, action.appointment_id);
}

/** Na hora de confirmar, confere de novo a agenda do Google (algo pode ter sido marcado lá). */
async function stillFreeOnGoogle(deps: SchedulingDeps, professionalId: string, start: Date, end: Date, ignore?: { start: Date; end: Date }) {
  if (!deps.calendar) return true;
  const { rows } = await deps.db.query<{ google_calendar_id: string | null }>(
    `select google_calendar_id from professionals where id = $1`,
    [professionalId],
  );
  const calendarId = rows[0]?.google_calendar_id;
  if (!calendarId) return true;
  let busy: Array<{ start: Date; end: Date }>;
  try {
    busy = (await deps.calendar.freeBusy([calendarId], start, end)).get(calendarId) ?? [];
  } catch {
    throw new SchedulingError("Não consegui consultar a agenda agora. Diga que a equipe vai confirmar e avise a equipe (scheduling_request).");
  }
  return !busy.some(
    (b) =>
      b.start < end &&
      start < b.end &&
      !(ignore && b.start.getTime() === ignore.start.getTime() && b.end.getTime() === ignore.end.getTime()),
  );
}

async function enqueueSync(tx: Queryable, appointmentId: string, maxAttempts: number) {
  await enqueueJob(tx, SYNC_CALENDAR, { appointmentId }, { maxAttempts });
}

async function confirmBooking(deps: SchedulingDeps, context: SchedulingContext, actionId: string, appointmentId: string, now: Date) {
  const { rows } = await deps.db.query<{ professional_id: string; starts_at: Date; ends_at: Date; status: string; hold_expires_at: Date | null }>(
    `select professional_id, starts_at, ends_at, status, hold_expires_at from appointments where id = $1`,
    [appointmentId],
  );
  const held = rows[0];
  if (!held || held.status !== "held" || (held.hold_expires_at && new Date(held.hold_expires_at) < now)) {
    throw new SchedulingError("A reserva desse horário expirou. Verifique a disponibilidade e faça uma nova proposta.");
  }
  if (!(await stillFreeOnGoogle(deps, held.professional_id, new Date(held.starts_at), new Date(held.ends_at)))) {
    await deps.db.query(`update appointments set status = 'expired', updated_at = now() where id = $1`, [appointmentId]);
    throw new SchedulingError("Esse horário acabou de ser ocupado na agenda do profissional. Ofereça outros horários.");
  }

  await deps.db.transaction(async (tx) => {
    const updated = await tx.query(
      `update appointments set status = 'scheduled', hold_expires_at = null, updated_at = now()
       where id = $1 and status = 'held' returning id`,
      [appointmentId],
    );
    if (updated.rows.length === 0) throw new SchedulingError("A reserva desse horário expirou. Faça uma nova proposta.");
    await tx.query(`update pending_actions set status = 'confirmed' where id = $1`, [actionId]);
    await tx.query(
      `update patients set name = coalesce(name, (select patient_name from appointments where id = $1)), updated_at = now()
       where id = (select patient_id from appointments where id = $1)`,
      [appointmentId],
    );
    await enqueueSync(tx, appointmentId, deps.jobMaxAttempts);
  });
  const listed = (await listAppointments(deps, context)).appointments.find((a) => a.appointment_id === appointmentId);
  return { status: "confirmado", appointment: listed };
}

async function confirmReschedule(
  deps: SchedulingDeps,
  context: SchedulingContext,
  actionId: string,
  originalId: string,
  payload: { professionalId?: string; startsAt?: string; endsAt?: string; blockedUntil?: string },
) {
  if (!payload.professionalId || !payload.startsAt || !payload.endsAt || !payload.blockedUntil) {
    throw new Error("Proposta de remarcação incompleta");
  }
  const start = new Date(payload.startsAt);
  const end = new Date(payload.endsAt);
  const original = await deps.db.query<{ starts_at: Date; ends_at: Date }>(`select starts_at, ends_at from appointments where id = $1`, [originalId]);
  const ignore = original.rows[0] ? { start: new Date(original.rows[0].starts_at), end: new Date(original.rows[0].ends_at) } : undefined;
  if (!(await stillFreeOnGoogle(deps, payload.professionalId, start, end, ignore))) {
    throw new SchedulingError("Esse horário acabou de ser ocupado na agenda do profissional. Ofereça outros horários.");
  }

  try {
    const newId = await deps.db.transaction(async (tx) => {
      const cancelled = await tx.query(
        `update appointments set status = 'cancelled', cancel_reason = 'rescheduled', cancelled_at = now(), updated_at = now()
         where id = $1 and status = 'scheduled' returning id`,
        [originalId],
      );
      if (cancelled.rows.length === 0) throw new SchedulingError("Esse agendamento não está mais ativo. Use list_my_appointments.");
      const inserted = await tx.query<{ id: string }>(
        `insert into appointments (clinic_id, professional_id, service_id, patient_id, conversation_id, patient_name,
                                   starts_at, ends_at, blocked_until, status, rescheduled_from)
         select clinic_id, $2, service_id, patient_id, $3, patient_name, $4, $5, $6, 'scheduled', id
         from appointments where id = $1
         returning id`,
        [originalId, payload.professionalId, context.conversationId, start, end, new Date(payload.blockedUntil!)],
      );
      await tx.query(`update pending_actions set status = 'confirmed' where id = $1`, [actionId]);
      await enqueueSync(tx, originalId, deps.jobMaxAttempts);
      await enqueueSync(tx, inserted.rows[0]!.id, deps.jobMaxAttempts);
      return inserted.rows[0]!.id;
    });
    const listed = (await listAppointments(deps, context)).appointments.find((a) => a.appointment_id === newId);
    return { status: "remarcado", appointment: listed };
  } catch (error) {
    if (isExclusionViolation(error)) throw new SchedulingError("Esse horário acabou de ser ocupado. Ofereça outros horários.");
    throw error;
  }
}

async function confirmCancellation(deps: SchedulingDeps, context: SchedulingContext, actionId: string, appointmentId: string) {
  const listed = (await listAppointments(deps, context)).appointments.find((a) => a.appointment_id === appointmentId);
  await deps.db.transaction(async (tx) => {
    const cancelled = await tx.query(
      `update appointments set status = 'cancelled', cancel_reason = 'patient', cancelled_at = now(), updated_at = now()
       where id = $1 and status = 'scheduled' returning id`,
      [appointmentId],
    );
    if (cancelled.rows.length === 0) throw new SchedulingError("Esse agendamento não está mais ativo.");
    await tx.query(`update pending_actions set status = 'confirmed' where id = $1`, [actionId]);
    await enqueueSync(tx, appointmentId, deps.jobMaxAttempts);
  });
  return { status: "cancelado", appointment: listed };
}
