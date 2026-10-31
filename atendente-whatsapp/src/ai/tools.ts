import type { BetaTool } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { z } from "zod";
import type { ClinicProfile } from "../clinics/profile.js";
import type { Db } from "../db/db.js";
import {
  checkAvailability,
  confirmPendingAction,
  listAppointments,
  proposeBooking,
  proposeCancellation,
  proposeReschedule,
  SchedulingError,
  type SchedulingDeps,
} from "../scheduling/service.js";
import { createAlert, type AlertKind } from "../team/alerts.js";

export interface ToolContext {
  db: Db;
  clinicId: string;
  conversationId: string;
  /** Última mensagem do paciente neste lote: chave para não repetir alertas. */
  sourceMessageId: string;
  jobMaxAttempts: number;
  /** null quando a clínica não tem agenda configurada. */
  scheduling: SchedulingDeps | null;
}

const NOTIFY_REASONS = [
  "emergency",
  "human_requested",
  "unanswered_question",
  "scheduling_request",
  "complaint",
  "other",
] as const satisfies readonly AlertKind[];

const notifyTeamInput = z.strictObject({
  reason: z.enum(NOTIFY_REASONS),
  summary: z.string().min(3).max(1000),
});

const BASE_TOOLS: BetaTool[] = [
  {
    name: "notify_team",
    description:
      "Avisa a equipe da clínica (recepção) pelo WhatsApp. Use em emergências, quando o paciente pedir " +
      "atendimento humano, quando você não tiver a informação pedida, para pedidos de agendamento, " +
      "remarcação ou cancelamento, e para reclamações. Depois de usar, diga ao paciente que a equipe foi avisada.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          enum: [...NOTIFY_REASONS],
          description:
            "emergency: emergência ou risco; human_requested: pediu para falar com uma pessoa; " +
            "unanswered_question: dúvida que os dados da clínica não respondem; scheduling_request: " +
            "quer marcar, remarcar ou cancelar; complaint: reclamação ou paciente irritado; other: outro motivo.",
        },
        summary: {
          type: "string",
          description:
            "Resumo curto e objetivo para a recepção, em português: o que o paciente quer ou relatou e os " +
            "detalhes úteis (serviço, dia e horário de preferência, nome se ele informou). Sem diagnósticos.",
        },
      },
      required: ["reason", "summary"],
      additionalProperties: false,
    },
  },
  {
    name: "request_data_deletion",
    description:
      "Registra o pedido do paciente para apagar os dados pessoais dele (LGPD) e avisa a equipe. " +
      "Use só quando o paciente pedir isso de forma clara.",
    strict: true,
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
];

const nullableString = (description: string) => ({ type: ["string", "null"], description });

const SCHEDULING_TOOLS: BetaTool[] = [
  {
    name: "check_availability",
    description:
      "Consulta horários livres de um serviço num intervalo de datas (até 14 dias). Considera expediente, " +
      "feriados, bloqueios, outros agendamentos e a agenda dos profissionais.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        service_key: { type: "string", description: "Key do serviço, entre colchetes na lista de serviços." },
        date_from: { type: "string", description: "Primeiro dia, AAAA-MM-DD." },
        date_to: nullableString("Último dia, AAAA-MM-DD. Nulo = 7 dias a partir de date_from."),
        period: { type: "string", enum: ["any", "morning", "afternoon", "evening"], description: "Período do dia preferido." },
        professional_key: nullableString("Key do profissional, se o paciente tiver preferência."),
      },
      required: ["service_key", "date_from", "date_to", "period", "professional_key"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_booking",
    description:
      "Reserva temporariamente um horário vindo de check_availability e devolve o resumo para o paciente confirmar. " +
      "NÃO confirma o agendamento.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        service_key: { type: "string" },
        professional_key: { type: "string" },
        start: { type: "string", description: "Data e hora de início, AAAA-MM-DDTHH:MM (horário da clínica)." },
        patient_name: { type: "string", description: "Nome completo de quem será atendido." },
      },
      required: ["service_key", "professional_key", "start", "patient_name"],
      additionalProperties: false,
    },
  },
  {
    name: "list_my_appointments",
    description: "Lista os próximos agendamentos deste paciente (deste número de WhatsApp).",
    strict: true,
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "propose_reschedule",
    description: "Prepara a remarcação de um agendamento para um novo horário livre e devolve o resumo. NÃO remarca ainda.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        appointment_id: { type: "string", description: "appointment_id vindo de list_my_appointments." },
        professional_key: nullableString("Novo profissional; nulo = o mesmo."),
        start: { type: "string", description: "Novo início, AAAA-MM-DDTHH:MM." },
      },
      required: ["appointment_id", "professional_key", "start"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_cancellation",
    description: "Prepara o cancelamento de um agendamento e devolve o resumo. NÃO cancela ainda.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { appointment_id: { type: "string", description: "appointment_id vindo de list_my_appointments." } },
      required: ["appointment_id"],
      additionalProperties: false,
    },
  },
  {
    name: "confirm_pending_action",
    description:
      "Efetiva a proposta (agendar, remarcar ou cancelar) depois que o paciente respondeu que concorda. " +
      "Só funciona com uma resposta do paciente posterior à proposta.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { action_id: { type: "string", description: "action_id devolvido pela proposta." } },
      required: ["action_id"],
      additionalProperties: false,
    },
  },
];

/** Ferramentas da clínica: as de agenda só entram quando há profissionais e serviços configurados. */
export function toolsFor(profile: Pick<ClinicProfile, "schedulingEnabled">): BetaTool[] {
  return profile.schedulingEnabled ? [...BASE_TOOLS, ...SCHEDULING_TOOLS] : BASE_TOOLS;
}

const checkAvailabilityInput = z.strictObject({
  service_key: z.string(),
  date_from: z.string(),
  date_to: z.string().nullable(),
  period: z.enum(["any", "morning", "afternoon", "evening"]),
  professional_key: z.string().nullable(),
});
const proposeBookingInput = z.strictObject({
  service_key: z.string(),
  professional_key: z.string(),
  start: z.string(),
  patient_name: z.string(),
});
const proposeRescheduleInput = z.strictObject({
  appointment_id: z.string(),
  professional_key: z.string().nullable(),
  start: z.string(),
});
const appointmentIdInput = z.strictObject({ appointment_id: z.string() });
const actionIdInput = z.strictObject({ action_id: z.string() });

async function runSchedulingTool(name: string, input: unknown, context: ToolContext): Promise<ToolOutcome | null> {
  const deps = context.scheduling;
  const scheduling = { clinicId: context.clinicId, conversationId: context.conversationId, sourceMessageId: context.sourceMessageId };
  const ok = (value: unknown): ToolOutcome => ({ content: JSON.stringify(value), isError: false, alerts: [] });
  const parse = <T>(schema: z.ZodType<T>): T => {
    const parsed = schema.safeParse(input);
    if (!parsed.success) throw new SchedulingError(`Entrada inválida: ${parsed.error.issues[0]?.message ?? "erro"}`);
    return parsed.data;
  };

  const names = new Set(SCHEDULING_TOOLS.map((t) => t.name));
  if (!names.has(name)) return null;
  if (!deps) return { content: "A agenda não está configurada para esta clínica.", isError: true, alerts: [] };

  try {
    switch (name) {
      case "check_availability": {
        const i = parse(checkAvailabilityInput);
        return ok(
          await checkAvailability(deps, scheduling, {
            serviceKey: i.service_key,
            dateFrom: i.date_from,
            dateTo: i.date_to,
            period: i.period,
            professionalKey: i.professional_key,
          }),
        );
      }
      case "propose_booking": {
        const i = parse(proposeBookingInput);
        return ok(
          await proposeBooking(deps, scheduling, {
            serviceKey: i.service_key,
            professionalKey: i.professional_key,
            start: i.start,
            patientName: i.patient_name,
          }),
        );
      }
      case "list_my_appointments":
        return ok(await listAppointments(deps, scheduling));
      case "propose_reschedule": {
        const i = parse(proposeRescheduleInput);
        return ok(await proposeReschedule(deps, scheduling, { appointmentId: i.appointment_id, professionalKey: i.professional_key, start: i.start }));
      }
      case "propose_cancellation":
        return ok(await proposeCancellation(deps, scheduling, { appointmentId: parse(appointmentIdInput).appointment_id }));
      case "confirm_pending_action":
        return ok(await confirmPendingAction(deps, scheduling, { actionId: parse(actionIdInput).action_id }));
    }
  } catch (error) {
    if (error instanceof SchedulingError) return { content: error.message, isError: true, alerts: [] };
    throw error;
  }
  return null;
}

export interface ToolOutcome {
  content: string;
  isError: boolean;
  /** Tipos de alerta disparados (usado pela rede de segurança e nos testes). */
  alerts: AlertKind[];
}

export async function runTool(name: string, input: unknown, context: ToolContext): Promise<ToolOutcome> {
  const scheduled = await runSchedulingTool(name, input, context);
  if (scheduled) return scheduled;

  if (name === "notify_team") {
    const parsed = notifyTeamInput.safeParse(input);
    if (!parsed.success) {
      return { content: `Entrada inválida: ${parsed.error.issues[0]?.message ?? "erro"}`, isError: true, alerts: [] };
    }
    const created = await createAlert(
      context.db,
      {
        clinicId: context.clinicId,
        conversationId: context.conversationId,
        kind: parsed.data.reason,
        summary: parsed.data.summary,
        sourceMessageId: context.sourceMessageId,
      },
      { maxAttempts: context.jobMaxAttempts },
    );
    return {
      content: created ? "Equipe avisada." : "A equipe já tinha sido avisada sobre isso.",
      isError: false,
      alerts: [parsed.data.reason],
    };
  }

  if (name === "request_data_deletion") {
    await context.db.query(
      `insert into data_deletion_requests (clinic_id, patient_id)
       select clinic_id, patient_id from conversations where id = $1
       on conflict (patient_id) where status = 'pending' do nothing`,
      [context.conversationId],
    );
    await createAlert(
      context.db,
      {
        clinicId: context.clinicId,
        conversationId: context.conversationId,
        kind: "data_deletion",
        summary: "O paciente pediu a exclusão dos dados pessoais dele. Conclua pelo comando de exclusão de dados.",
        sourceMessageId: context.sourceMessageId,
      },
      { maxAttempts: context.jobMaxAttempts },
    );
    return { content: "Pedido de exclusão registrado; a equipe foi avisada.", isError: false, alerts: ["data_deletion"] };
  }

  return { content: `Ferramenta desconhecida: ${name}`, isError: true, alerts: [] };
}
