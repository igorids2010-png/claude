import { afterEach, describe, expect, it } from "vitest";
import { fromLocal } from "../../src/lib/time.js";
import { eventIdFor } from "../../src/scheduling/google-calendar.js";
import {
  checkAvailability,
  confirmPendingAction,
  listAppointments,
  proposeBooking,
  proposeCancellation,
  proposeReschedule,
  SchedulingError,
  type SchedulingContext,
} from "../../src/scheduling/service.js";
import { toolsFor } from "../../src/ai/tools.js";
import { PATIENT_WA_ID } from "../helpers/constants.js";
import { createFakeCalendar } from "../helpers/fake-calendar.js";
import { createHarness, type Harness } from "../helpers/harness.js";
import { textMessage, webhookPayload } from "../helpers/payloads.js";

const TZ = "America/Sao_Paulo";
let now = fromLocal("2026-10-28", "07:00", TZ); // quarta-feira
let h: Harness;
let calendar: ReturnType<typeof createFakeCalendar>;

afterEach(async () => {
  await h?.close();
});

const PROFESSIONALS = {
  professionals: [
    { key: "ana", name: "Dra. Ana", google_calendar_id: "ana@agenda" },
    { key: "joao", name: "Dr. João", services: ["sessao"], hours: { tue: ["13:00-19:00"] } },
  ],
  scheduling: { slot_step_minutes: 60, min_advance_minutes: 60, max_advance_days: 30 },
};

async function setup(clinic: Record<string, unknown> = {}) {
  now = fromLocal("2026-10-28", "07:00", TZ);
  calendar = createFakeCalendar();
  h = await createHarness({ clinic: { ...PROFESSIONALS, ...clinic }, now: () => now, calendar: calendar.client });
}

/** Simula uma nova mensagem do paciente e devolve o contexto do turno. */
async function turn(from = PATIENT_WA_ID, body = "ok"): Promise<SchedulingContext> {
  const message = textMessage(body, { from });
  await h.postWebhook(webhookPayload({ messages: [message] }));
  const { rows } = await h.db.query<{ id: string; conversation_id: string }>(
    "select id, conversation_id from messages where wa_message_id = $1",
    [message.id],
  );
  return { clinicId: h.clinicId, conversationId: rows[0]!.conversation_id, sourceMessageId: rows[0]!.id };
}

const book = (ctx: SchedulingContext, start: string, professionalKey = "ana", serviceKey = "avaliacao") =>
  proposeBooking(h.scheduling, ctx, { serviceKey, professionalKey, start, patientName: "Maria Souza" });

const statuses = async () =>
  (await h.db.query<{ status: string }>("select status from appointments order by created_at")).rows.map((r) => r.status);

describe("consulta de horários", () => {
  it("pula feriado nacional (Finados) e dias fechados, respeita expediente e grade", async () => {
    await setup();
    const ctx = await turn();
    const result = await checkAvailability(h.scheduling, ctx, {
      serviceKey: "avaliacao",
      dateFrom: "2026-10-28",
      dateTo: "2026-11-03",
      period: "any",
      professionalKey: null,
    });
    // Qua-Sex fechados, sáb 31/10 8-12, dom fechado, seg 02/11 é Finados, ter 03/11 8-19.
    expect(result.available.map((d) => d.date)).toEqual(["2026-10-31", "2026-11-03"]);
    expect(result.available[0]!.times.map((t) => t.time)).toEqual(["08:00", "09:00", "10:00", "11:00"]);
  });

  it("só oferece profissionais que atendem o serviço, no horário deles", async () => {
    await setup();
    const ctx = await turn();
    const result = await checkAvailability(h.scheduling, ctx, {
      serviceKey: "sessao",
      dateFrom: "2026-11-03",
      dateTo: "2026-11-03",
      period: "any",
      professionalKey: "joao",
    });
    expect(result.available[0]!.times.map((t) => t.time)).toEqual(["13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]);
    await expect(
      checkAvailability(h.scheduling, ctx, { serviceKey: "avaliacao", dateFrom: "2026-11-03", dateTo: null, period: "any", professionalKey: "joao" }),
    ).rejects.toThrow(/não atende/);
  });

  it("compromissos da agenda do Google bloqueiam horários", async () => {
    await setup();
    calendar.setBusy("ana@agenda", [{ start: fromLocal("2026-10-31", "08:30", TZ), end: fromLocal("2026-10-31", "10:00", TZ) }]);
    const ctx = await turn();
    const result = await checkAvailability(h.scheduling, ctx, {
      serviceKey: "avaliacao",
      dateFrom: "2026-10-31",
      dateTo: "2026-10-31",
      period: "any",
      professionalKey: "ana",
    });
    expect(result.available[0]!.times.map((t) => t.time)).toEqual(["10:00", "11:00"]);
  });

  it("Google fora do ar: erro claro para a IA, sem oferecer horários incertos", async () => {
    await setup();
    calendar.state.failFreeBusy = true;
    const ctx = await turn();
    await expect(
      checkAvailability(h.scheduling, ctx, { serviceKey: "avaliacao", dateFrom: "2026-10-31", dateTo: null, period: "any", professionalKey: "ana" }),
    ).rejects.toThrow(SchedulingError);
  });

  it("bloqueios do arquivo de configuração", async () => {
    await setup({ blocks: [{ start: "2026-10-31T08:00", end: "2026-10-31T10:00", professional: "ana", reason: "curso" }] });
    const ctx = await turn();
    const result = await checkAvailability(h.scheduling, ctx, {
      serviceKey: "avaliacao",
      dateFrom: "2026-10-31",
      dateTo: "2026-10-31",
      period: "any",
      professionalKey: "ana",
    });
    expect(result.available[0]!.times.map((t) => t.time)).toEqual(["10:00", "11:00"]);
  });

  it("clínica sem profissionais não recebe ferramentas de agenda", async () => {
    expect(toolsFor({ schedulingEnabled: false }).map((t) => t.name)).toEqual(["notify_team", "request_data_deletion"]);
    expect(toolsFor({ schedulingEnabled: true }).map((t) => t.name)).toContain("confirm_pending_action");
  });
});

describe("agendamento com confirmação em duas etapas", () => {
  it("propõe, recusa confirmação no mesmo turno e confirma depois do sim do paciente", async () => {
    await setup();
    const first = await turn(PATIENT_WA_ID, "quero sábado às 9");
    const proposal = await book(first, "2026-10-31T09:00");
    expect(proposal.summary).toMatchObject({ professional: "Dra. Ana", when: "sábado, 31/10 às 09:00", price: "R$ 150,00", patient_name: "Maria Souza" });
    expect(await statuses()).toEqual(["held"]);

    await expect(confirmPendingAction(h.scheduling, first, { actionId: proposal.action_id })).rejects.toThrow(/ainda não respondeu/);

    const reply = await turn(PATIENT_WA_ID, "sim, pode confirmar");
    const confirmed = await confirmPendingAction(h.scheduling, reply, { actionId: proposal.action_id });
    expect(confirmed.status).toBe("confirmado");
    expect(await statuses()).toEqual(["scheduled"]);

    // Reusar a mesma proposta não marca de novo.
    await expect(confirmPendingAction(h.scheduling, reply, { actionId: proposal.action_id })).rejects.toThrow(/já usada/);

    const patient = await h.db.query<{ name: string }>("select name from patients");
    expect(patient.rows[0]!.name).toBe("Maria Souza");
  });

  it("sincroniza com o Google Calendar do profissional", async () => {
    await setup();
    const ctx = await turn();
    const proposal = await book(ctx, "2026-10-31T09:00");
    await confirmPendingAction(h.scheduling, await turn(), { actionId: proposal.action_id });
    await h.worker.runOnce();

    const { rows } = await h.db.query<{ id: string; google_event_id: string; google_sync_status: string }>(
      "select id, google_event_id, google_sync_status from appointments",
    );
    expect(rows[0]).toMatchObject({ google_event_id: eventIdFor(rows[0]!.id), google_sync_status: "synced" });
    expect(calendar.inserted).toEqual([
      expect.objectContaining({
        calendarId: "ana@agenda",
        id: eventIdFor(rows[0]!.id),
        summary: "Avaliação fisioterapêutica - Maria Souza",
        timeZone: TZ,
        start: fromLocal("2026-10-31", "09:00", TZ),
        end: fromLocal("2026-10-31", "09:50", TZ),
      }),
    ]);
    expect(calendar.inserted[0]!.description).toContain("+55 11 99999-0000");
  });

  it("profissional sem agenda no Google: sincronização marcada como não configurada", async () => {
    await setup();
    const ctx = await turn();
    const proposal = await book(ctx, "2026-11-03T14:00", "joao", "sessao");
    await confirmPendingAction(h.scheduling, await turn(), { actionId: proposal.action_id });
    await h.worker.runOnce();
    const { rows } = await h.db.query<{ google_sync_status: string }>("select google_sync_status from appointments");
    expect(rows[0]!.google_sync_status).toBe("not_configured");
    expect(calendar.inserted).toHaveLength(0);
  });

  it("horário reservado não aparece nem pode ser pego por outro paciente", async () => {
    await setup();
    const maria = await turn(PATIENT_WA_ID);
    await book(maria, "2026-10-31T09:00");

    const outro = await turn("5511888887777");
    const result = await checkAvailability(h.scheduling, outro, {
      serviceKey: "avaliacao",
      dateFrom: "2026-10-31",
      dateTo: "2026-10-31",
      period: "any",
      professionalKey: "ana",
    });
    expect(result.available[0]!.times.map((t) => t.time)).not.toContain("09:00");
    await expect(book(outro, "2026-10-31T09:00")).rejects.toThrow(/não está disponível/);
  });

  it("a constraint do banco impede conflito mesmo com propostas simultâneas", async () => {
    await setup();
    const a = await turn(PATIENT_WA_ID);
    const b = await turn("5511888887777");
    const results = await Promise.allSettled([book(a, "2026-10-31T09:00"), book(b, "2026-10-31T09:00")]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(SchedulingError);
    expect(await statuses()).toEqual(["held"]);
  });

  it("constraint direta: dois agendamentos sobrepostos são recusados pelo Postgres", async () => {
    await setup();
    const ctx = await turn();
    const proposal = await book(ctx, "2026-10-31T09:00");
    await confirmPendingAction(h.scheduling, await turn(), { actionId: proposal.action_id });
    const error = await h.db
      .query(
        `insert into appointments (clinic_id, professional_id, service_id, patient_name, starts_at, ends_at, blocked_until, status)
         select clinic_id, professional_id, service_id, 'X', starts_at + interval '20 minutes', ends_at + interval '20 minutes',
                blocked_until + interval '20 minutes', 'scheduled' from appointments limit 1`,
      )
      .catch((e: unknown) => e);
    expect((error as { code?: string }).code).toBe("23P01");
  });

  it("reserva expira: outro paciente pode marcar e a confirmação antiga falha", async () => {
    await setup();
    const maria = await turn(PATIENT_WA_ID);
    const proposal = await book(maria, "2026-10-31T09:00");
    now = new Date(now.getTime() + 25 * 60_000); // reserva de 20 min
    const outro = await turn("5511888887777");
    await expect(book(outro, "2026-10-31T09:00")).resolves.toBeTruthy();
    await expect(confirmPendingAction(h.scheduling, await turn(PATIENT_WA_ID), { actionId: proposal.action_id })).rejects.toThrow(/expirou/);
  });

  it("nova proposta do mesmo paciente substitui a anterior (mudou de ideia)", async () => {
    await setup();
    const ctx = await turn();
    const first = await book(ctx, "2026-10-31T09:00");
    const second = await book(await turn(), "2026-10-31T10:00");
    expect(await statuses()).toEqual(["expired", "held"]);
    await expect(confirmPendingAction(h.scheduling, await turn(), { actionId: first.action_id })).rejects.toThrow(/já usada/);
    await expect(confirmPendingAction(h.scheduling, await turn(), { actionId: second.action_id })).resolves.toMatchObject({ status: "confirmado" });
  });

  it("confirmação confere o Google de novo: se ocupou no meio tempo, não marca", async () => {
    await setup();
    const ctx = await turn();
    const proposal = await book(ctx, "2026-10-31T09:00");
    calendar.setBusy("ana@agenda", [{ start: fromLocal("2026-10-31", "09:00", TZ), end: fromLocal("2026-10-31", "09:30", TZ) }]);
    await expect(confirmPendingAction(h.scheduling, await turn(), { actionId: proposal.action_id })).rejects.toThrow(/ocupado/);
    expect(await statuses()).toEqual(["expired"]);
  });

  it("recusa horários fora da disponibilidade e nome ausente", async () => {
    await setup();
    const ctx = await turn();
    await expect(book(ctx, "2026-10-29T09:00")).rejects.toThrow(/não está disponível/); // quinta: fechado
    await expect(book(ctx, "2026-10-31T09:15")).rejects.toThrow(/não está disponível/); // fora da grade
    await expect(book(ctx, "31/10 9h")).rejects.toThrow(/inválido/);
    await expect(
      proposeBooking(h.scheduling, ctx, { serviceKey: "avaliacao", professionalKey: "ana", start: "2026-10-31T09:00", patientName: " " }),
    ).rejects.toThrow(/nome/);
  });
});

describe("remarcação e cancelamento", () => {
  async function scheduled(start = "2026-10-31T09:00") {
    const proposal = await book(await turn(), start);
    await confirmPendingAction(h.scheduling, await turn(), { actionId: proposal.action_id });
    await h.worker.runOnce();
    return (await listAppointments(h.scheduling, await turn())).appointments[0]!;
  }

  it("lista só os agendamentos do próprio paciente", async () => {
    await setup();
    await scheduled("2026-10-31T09:00");
    const outro = await turn("5511888887777");
    const proposal = await book(outro, "2026-10-31T10:00");
    await confirmPendingAction(h.scheduling, await turn("5511888887777"), { actionId: proposal.action_id });

    const mine = await listAppointments(h.scheduling, await turn(PATIENT_WA_ID));
    expect(mine.appointments.map((a) => a.label)).toEqual(["sábado, 31/10 às 09:00"]);
    await expect(
      proposeCancellation(h.scheduling, await turn(PATIENT_WA_ID), {
        appointmentId: (await listAppointments(h.scheduling, await turn("5511888887777"))).appointments[0]!.appointment_id,
      }),
    ).rejects.toThrow(/não encontrado/);
  });

  it("remarca de forma atômica e atualiza o Google", async () => {
    await setup();
    const original = await scheduled("2026-10-31T09:00");
    const proposal = await proposeReschedule(h.scheduling, await turn(), {
      appointmentId: original.appointment_id,
      professionalKey: null,
      start: "2026-10-31T10:00",
    });
    expect(proposal.summary).toMatchObject({ previous: "sábado, 31/10 às 09:00", when: "sábado, 31/10 às 10:00" });
    expect(await statuses()).toEqual(["scheduled"]); // nada muda antes do sim

    const done = await confirmPendingAction(h.scheduling, await turn(), { actionId: proposal.action_id });
    expect(done).toMatchObject({ status: "remarcado", appointment: { label: "sábado, 31/10 às 10:00" } });
    expect(await statuses()).toEqual(["cancelled", "scheduled"]);

    await h.worker.runOnce();
    expect(calendar.deleted).toEqual([{ calendarId: "ana@agenda", eventId: eventIdFor(original.appointment_id) }]);
    expect(calendar.inserted.map((e) => e.start)).toEqual([fromLocal("2026-10-31", "09:00", TZ), fromLocal("2026-10-31", "10:00", TZ)]);
  });

  it("o próprio horário antigo conta como livre na remarcação (inclusive no Google)", async () => {
    await setup({ scheduling: { slot_step_minutes: 30, min_advance_minutes: 60, max_advance_days: 30 } });
    const original = await scheduled("2026-10-31T09:00");
    // O evento da própria consulta aparece como ocupado no Google.
    calendar.setBusy("ana@agenda", [{ start: fromLocal("2026-10-31", "09:00", TZ), end: fromLocal("2026-10-31", "09:50", TZ) }]);
    const proposal = await proposeReschedule(h.scheduling, await turn(), {
      appointmentId: original.appointment_id,
      professionalKey: null,
      start: "2026-10-31T09:30",
    });
    await expect(confirmPendingAction(h.scheduling, await turn(), { actionId: proposal.action_id })).resolves.toMatchObject({ status: "remarcado" });
  });

  it("cancela depois da confirmação e remove do Google", async () => {
    await setup();
    const appointment = await scheduled();
    const proposal = await proposeCancellation(h.scheduling, await turn(), { appointmentId: appointment.appointment_id });
    expect(await statuses()).toEqual(["scheduled"]);
    await expect(confirmPendingAction(h.scheduling, await turn(), { actionId: proposal.action_id })).resolves.toMatchObject({ status: "cancelado" });
    expect(await statuses()).toEqual(["cancelled"]);
    await h.worker.runOnce();
    expect(calendar.deleted.map((d) => d.eventId)).toEqual([eventIdFor(appointment.appointment_id)]);
    expect((await listAppointments(h.scheduling, await turn())).appointments).toEqual([]);
  });
});
