import type { BetaTool } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { z } from "zod";
import type { Db } from "../db/db.js";
import { createAlert, type AlertKind } from "../team/alerts.js";

export interface ToolContext {
  db: Db;
  clinicId: string;
  conversationId: string;
  /** Última mensagem do paciente neste lote: chave para não repetir alertas. */
  sourceMessageId: string;
  jobMaxAttempts: number;
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

export const TOOLS: BetaTool[] = [
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

export interface ToolOutcome {
  content: string;
  isError: boolean;
  /** Tipos de alerta disparados (usado pela rede de segurança e nos testes). */
  alerts: AlertKind[];
}

export async function runTool(name: string, input: unknown, context: ToolContext): Promise<ToolOutcome> {
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
