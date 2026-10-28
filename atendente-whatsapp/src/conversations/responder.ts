import { PLACEHOLDER_REPLY_TEXT } from "./texts.js";

export interface PendingInbound {
  id: string;
  kind: string;
  body: string | null;
}

export interface ReplyContext {
  clinicId: string;
  clinicName: string;
  conversationId: string;
  /** Mensagens legíveis (texto e botões) ainda não respondidas, em ordem. */
  messages: PendingInbound[];
}

/** Gera as respostas de texto para as mensagens legíveis do paciente. */
export interface Responder {
  reply(context: ReplyContext): Promise<string[]>;
}

/** Fase 1: resposta fixa. A Fase 2 implementa esta interface com o Claude. */
export const placeholderResponder: Responder = {
  async reply() {
    return [PLACEHOLDER_REPLY_TEXT];
  },
};
