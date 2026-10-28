import { z } from "zod";

/*
 * Schema do webhook da WhatsApp Cloud API. Usamos objetos "loose": a Meta adiciona
 * campos com frequência e um campo novo não pode derrubar o recebimento.
 */

const inboundMessageSchema = z.looseObject({
  from: z.string(),
  id: z.string(),
  timestamp: z.string(),
  type: z.string(),
  text: z.looseObject({ body: z.string() }).optional(),
  button: z.looseObject({ text: z.string().optional(), payload: z.string().optional() }).optional(),
  interactive: z
    .looseObject({
      type: z.string(),
      button_reply: z.looseObject({ id: z.string(), title: z.string() }).optional(),
      list_reply: z.looseObject({ id: z.string(), title: z.string() }).optional(),
    })
    .optional(),
});

const statusSchema = z.looseObject({
  id: z.string(),
  status: z.string(),
  timestamp: z.string(),
  recipient_id: z.string().optional(),
  errors: z.array(z.looseObject({ code: z.number().optional(), title: z.string().optional() })).optional(),
});

const valueSchema = z.looseObject({
  messaging_product: z.string().optional(),
  metadata: z.looseObject({
    display_phone_number: z.string().optional(),
    phone_number_id: z.string(),
  }),
  messages: z.array(inboundMessageSchema).optional(),
  statuses: z.array(statusSchema).optional(),
});

export const webhookPayloadSchema = z.looseObject({
  object: z.string(),
  entry: z.array(
    z.looseObject({
      id: z.string(),
      changes: z.array(z.looseObject({ field: z.string(), value: z.unknown() })),
    }),
  ),
});

export type MessageKind =
  | "text"
  | "button"
  | "interactive"
  | "audio"
  | "image"
  | "sticker"
  | "video"
  | "document"
  | "location"
  | "contacts"
  | "reaction"
  | "unsupported";

/** Tipos que a IA consegue ler (texto e respostas de botões). */
export const READABLE_KINDS: ReadonlySet<MessageKind> = new Set(["text", "button", "interactive"]);
/** Tipos que recebem a resposta educada de "por enquanto só leio texto". */
export const MEDIA_KINDS: ReadonlySet<MessageKind> = new Set([
  "audio",
  "image",
  "sticker",
  "video",
  "document",
  "location",
  "contacts",
]);

export interface InboundMessage {
  phoneNumberId: string;
  waId: string;
  waMessageId: string;
  timestamp: Date;
  kind: MessageKind;
  /** Texto legível: corpo do texto ou título do botão escolhido. */
  body: string | null;
}

export interface StatusUpdate {
  phoneNumberId: string;
  waMessageId: string;
  status: string;
  timestamp: Date;
  errorCode: number | undefined;
}

export interface ParsedWebhook {
  messages: InboundMessage[];
  statuses: StatusUpdate[];
  /** Mudanças que não conseguimos interpretar (logadas e ignoradas). */
  skipped: number;
}

const KNOWN_KINDS = new Set<string>([
  "text",
  "button",
  "interactive",
  "audio",
  "image",
  "sticker",
  "video",
  "document",
  "location",
  "contacts",
  "reaction",
]);

function toKind(type: string): MessageKind {
  if (type === "voice") return "audio";
  return KNOWN_KINDS.has(type) ? (type as MessageKind) : "unsupported";
}

function toDate(unixSeconds: string): Date {
  const seconds = Number(unixSeconds);
  return Number.isFinite(seconds) ? new Date(seconds * 1000) : new Date();
}

export function parseWebhook(payload: unknown): ParsedWebhook | null {
  const parsed = webhookPayloadSchema.safeParse(payload);
  if (!parsed.success || parsed.data.object !== "whatsapp_business_account") return null;

  const result: ParsedWebhook = { messages: [], statuses: [], skipped: 0 };
  for (const entry of parsed.data.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue;
      const value = valueSchema.safeParse(change.value);
      if (!value.success) {
        result.skipped++;
        continue;
      }
      const phoneNumberId = value.data.metadata.phone_number_id;

      for (const message of value.data.messages ?? []) {
        const kind = toKind(message.type);
        let body: string | null = null;
        if (kind === "text") body = message.text?.body ?? null;
        else if (kind === "button") body = message.button?.text ?? message.button?.payload ?? null;
        else if (kind === "interactive")
          body = message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title ?? null;

        result.messages.push({
          phoneNumberId,
          waId: message.from,
          waMessageId: message.id,
          timestamp: toDate(message.timestamp),
          kind,
          body,
        });
      }

      for (const status of value.data.statuses ?? []) {
        result.statuses.push({
          phoneNumberId,
          waMessageId: status.id,
          status: status.status,
          timestamp: toDate(status.timestamp),
          errorCode: status.errors?.[0]?.code,
        });
      }
    }
  }
  return result;
}
