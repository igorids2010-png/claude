import { PATIENT_WA_ID, PHONE_NUMBER_ID } from "./constants.js";

let counter = 0;
export const nextWamid = () => `wamid.TEST${Date.now()}${++counter}`;
export const nowSeconds = () => String(Math.floor(Date.now() / 1000));

type Message = Record<string, unknown>;

export function textMessage(body: string, overrides: Message = {}): Message {
  return { from: PATIENT_WA_ID, id: nextWamid(), timestamp: nowSeconds(), type: "text", text: { body }, ...overrides };
}

export function mediaMessage(type: "audio" | "image" | "sticker" | "video" | "document", overrides: Message = {}): Message {
  return {
    from: PATIENT_WA_ID,
    id: nextWamid(),
    timestamp: nowSeconds(),
    type,
    [type]: { id: "media-id", mime_type: "application/octet-stream" },
    ...overrides,
  };
}

export function reactionMessage(targetId: string): Message {
  return {
    from: PATIENT_WA_ID,
    id: nextWamid(),
    timestamp: nowSeconds(),
    type: "reaction",
    reaction: { message_id: targetId, emoji: "👍" },
  };
}

/** Envelope no formato que a Meta envia para o webhook. */
export function webhookPayload(
  options: { messages?: Message[]; statuses?: Message[]; phoneNumberId?: string } = {},
): Record<string, unknown> {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA_ID",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "5511900000000", phone_number_id: options.phoneNumberId ?? PHONE_NUMBER_ID },
              contacts: [{ profile: { name: "Paciente Teste" }, wa_id: PATIENT_WA_ID }],
              ...(options.messages ? { messages: options.messages } : {}),
              ...(options.statuses ? { statuses: options.statuses } : {}),
            },
          },
        ],
      },
    ],
  };
}

export function statusEvent(waMessageId: string, status: string, errors?: Array<{ code: number }>): Message {
  return {
    id: waMessageId,
    status,
    timestamp: nowSeconds(),
    recipient_id: PATIENT_WA_ID,
    ...(errors ? { errors } : {}),
  };
}
