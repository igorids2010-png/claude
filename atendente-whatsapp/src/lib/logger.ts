import { pino, type Logger, type LoggerOptions } from "pino";

/**
 * LGPD: nenhum dado pessoal nos logs. Logamos apenas IDs internos (clinicId,
 * conversationId, messageId). Os caminhos abaixo são uma rede de segurança caso algum
 * objeto com conteúdo de mensagem ou telefone seja logado por engano.
 */
export const redactPaths = [
  "req.headers.authorization",
  "req.headers['x-hub-signature-256']",
  "*.accessToken",
  "*.access_token",
  "*.token",
  "*.body",
  "*.text",
  "*.waId",
  "*.wa_id",
  "*.from",
  "*.to",
  "*.phone",
  "*.name",
];

export function createLogger(options: { level: string; pretty?: boolean }): Logger {
  const config: LoggerOptions = {
    level: options.level,
    redact: { paths: redactPaths, censor: "[redacted]" },
    base: { service: "atendente-whatsapp" },
  };
  if (options.pretty) {
    config.transport = { target: "pino-pretty", options: { colorize: true } };
  }
  return pino(config);
}

export type { Logger };
