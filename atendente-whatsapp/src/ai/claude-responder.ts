import type {
  BetaMessage,
  BetaMessageParam,
  BetaToolResultBlockParam,
  MessageCreateParamsNonStreaming,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { ClinicProfile } from "../clinics/profile.js";
import type { ReplyContext, Responder } from "../conversations/responder.js";
import type { Db } from "../db/db.js";
import type { Logger } from "../lib/logger.js";
import { createAlert, hasRecentAlert, type AlertKind } from "../team/alerts.js";
import { loadHistory, type HistoryOptions } from "./history.js";
import { buildSystemPrompt, buildTurnContext } from "./prompt.js";
import { detectEmergency, emergencyText, replyCoversEmergency } from "./safety.js";
import { runTool, TOOLS } from "./tools.js";
import { recordUsage, usageCounts } from "./usage.js";

export type CreateMessage = (params: MessageCreateParamsNonStreaming) => Promise<BetaMessage>;
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface ClaudeResponderOptions {
  db: Db;
  logger: Logger;
  createMessage: CreateMessage;
  getProfile: (clinicId: string) => Promise<ClinicProfile | null>;
  model: string;
  effort: Effort;
  maxTokens: number;
  /** Refaz automaticamente, em outro modelo, pedidos que o modelo principal recusar. */
  serverFallbacks: boolean;
  history: HistoryOptions;
  maxCallsPerConversationPerHour: number;
  maxCallsPerClinicPerDay: number;
  jobMaxAttempts: number;
  now?: () => Date;
}

/** Rodadas de ferramenta por resposta: o suficiente para avisar a equipe e responder. */
const MAX_ROUNDS = 4;
const ONE_HOUR = 60 * 60 * 1000;

export const AI_UNAVAILABLE_TEXT =
  "Desculpe, estou com uma instabilidade agora 😕 Já avisei a nossa equipe, que vai te responder por aqui o quanto antes.";
export const RATE_LIMITED_TEXT =
  "Recebi muitas mensagens em pouco tempo. Para não te deixar sem resposta, já avisei a nossa equipe, que continua o atendimento por aqui.";
export const COULD_NOT_ANSWER_TEXT =
  "Essa eu prefiro confirmar com a nossa equipe para não te passar nada errado. Já avisei, e eles te respondem por aqui.";

export function createClaudeResponder(options: ClaudeResponderOptions): Responder {
  const now = options.now ?? (() => new Date());

  return {
    async reply(context: ReplyContext): Promise<string[]> {
      const log = options.logger.child({ conversationId: context.conversationId, clinicId: context.clinicId });
      const profile = await options.getProfile(context.clinicId);
      if (!profile) throw new Error("Clínica não encontrada");

      const alert = (kind: AlertKind, summary: string) =>
        createAlert(
          options.db,
          {
            clinicId: context.clinicId,
            conversationId: context.conversationId,
            kind,
            summary,
            sourceMessageId: context.sourceMessageId,
          },
          { maxAttempts: options.jobMaxAttempts },
        );

      const patientText = context.messages.map((m) => m.body ?? "").join("\n");
      const emergency = detectEmergency(patientText, { veterinary: profile.specialty === "veterinaria" });
      const alertEmergency = () => alert("emergency", `Mensagem com sinais de emergência: "${patientText.slice(0, 300)}"`);
      const withSafetyNet = async (reply: string): Promise<string[]> => {
        if (!emergency) return [reply];
        await alertEmergency();
        return replyCoversEmergency(reply, emergency) ? [reply] : [emergencyText(emergency), reply];
      };
      /** Quando a IA não responde: emergência continua tendo orientação e alerta próprios. */
      const fallbackReply = async (text: string): Promise<string[]> => {
        if (!emergency) return [text];
        await alertEmergency();
        return [emergencyText(emergency)];
      };

      // Limites de uso: protegem contra abuso e contra uma conta alta no fim do mês.
      const counts = await usageCounts(options.db, context.clinicId, context.conversationId, profile.timezone);
      if (counts.conversationLastHour >= options.maxCallsPerConversationPerHour) {
        log.warn({ calls: counts.conversationLastHour }, "limite de chamadas da conversa atingido");
        if (emergency) return fallbackReply("");
        if (await hasRecentAlert(options.db, context.conversationId, "other", ONE_HOUR)) return [];
        await alert("other", "Muitas mensagens em pouco tempo: o atendente automático pausou nesta conversa por 1 hora.");
        return [RATE_LIMITED_TEXT];
      }
      if (counts.clinicToday >= options.maxCallsPerClinicPerDay) {
        log.error({ calls: counts.clinicToday }, "limite diário de chamadas da clínica atingido");
        await alert("ai_failure", "Limite diário de uso do atendente automático atingido. Responda este paciente manualmente.");
        return fallbackReply(AI_UNAVAILABLE_TEXT);
      }

      const history = await loadHistory(options.db, context.conversationId, options.history);
      if (history.length === 0) return [];
      const messages: BetaMessageParam[] = [
        ...history,
        { role: "system", content: buildTurnContext(now(), profile.timezone, { firstReply: context.firstReply }) },
      ];
      const system = buildSystemPrompt(profile);

      let reply = "";
      try {
        for (let round = 1; round <= MAX_ROUNDS; round++) {
          const response = await options.createMessage({
            model: options.model,
            max_tokens: options.maxTokens,
            system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
            tools: TOOLS,
            tool_choice: { type: "auto" },
            output_config: { effort: options.effort },
            messages,
            ...(options.serverFallbacks
              ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
              : {}),
          });
          await recordUsage(options.db, context.clinicId, context.conversationId, response).catch((error: unknown) =>
            log.error({ err: error }, "falha ao registrar uso de tokens"),
          );

          const text = response.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("\n")
            .trim();
          if (text) reply = text;

          if (response.stop_reason === "refusal") {
            log.warn({ category: response.stop_details?.category ?? null }, "modelo recusou responder");
            reply = "";
            break;
          }
          if (response.stop_reason !== "tool_use") break;

          // O conteúdo da resposta volta inalterado (inclusive blocos de raciocínio).
          messages.push({ role: "assistant", content: response.content });
          const results: BetaToolResultBlockParam[] = [];
          for (const block of response.content) {
            if (block.type !== "tool_use") continue;
            const outcome = await runTool(block.name, block.input, {
              db: options.db,
              clinicId: context.clinicId,
              conversationId: context.conversationId,
              sourceMessageId: context.sourceMessageId,
              jobMaxAttempts: options.jobMaxAttempts,
            });
            log.info({ tool: block.name, isError: outcome.isError }, "ferramenta executada");
            results.push({ type: "tool_result", tool_use_id: block.id, content: outcome.content, is_error: outcome.isError });
          }
          messages.push({ role: "user", content: results });
        }
      } catch (error) {
        // Falha da API do Claude (fora do ar, chave inválida, limite): resposta padrão + aviso à equipe.
        log.error({ err: (error as Error).message, status: (error as { status?: number }).status }, "falha na API do Claude");
        await alert("ai_failure", "O atendente automático está com falha e não respondeu este paciente. Responda manualmente.");
        return fallbackReply(AI_UNAVAILABLE_TEXT);
      }

      if (!reply) {
        await alert("unanswered_question", `O atendente não conseguiu responder: "${patientText.slice(0, 300)}"`);
        return withSafetyNet(COULD_NOT_ANSWER_TEXT);
      }
      return withSafetyNet(toWhatsAppFormatting(reply));
    },
  };
}

/** Ajusta o markdown que escapar para o formato do WhatsApp. */
export function toWhatsAppFormatting(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/__(.+?)__/g, "_$1_")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
