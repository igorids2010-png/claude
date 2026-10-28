import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { Queryable } from "../db/db.js";

export interface HistoryOptions {
  maxMessages: number;
  maxChars: number;
}

const MEDIA_PLACEHOLDER: Record<string, string> = {
  audio: "[o paciente enviou um áudio]",
  image: "[o paciente enviou uma imagem]",
  sticker: "[o paciente enviou uma figurinha]",
  video: "[o paciente enviou um vídeo]",
  document: "[o paciente enviou um documento]",
  location: "[o paciente enviou uma localização]",
  contacts: "[o paciente enviou um contato]",
  unsupported: "[o paciente enviou uma mensagem que não consigo abrir]",
};

interface Row {
  direction: "inbound" | "outbound";
  type: string;
  body: string | null;
}

/**
 * Monta o histórico da conversa para a API: as últimas mensagens, cortando as mais antigas
 * até caber no limite de caracteres. Só texto: os blocos de raciocínio de turnos anteriores
 * não são guardados, então editar ou cortar o começo do histórico é seguro.
 */
export async function loadHistory(db: Queryable, conversationId: string, options: HistoryOptions): Promise<BetaMessageParam[]> {
  const { rows } = await db.query<Row>(
    `select direction, type, body from (
       select direction, type, body, created_at, id
       from messages
       where conversation_id = $1
         and (direction = 'inbound' or status in ('sent', 'delivered', 'read'))
       order by created_at desc, id desc
       limit $2
     ) recent
     order by created_at, id`,
    [conversationId, options.maxMessages],
  );
  return toMessages(rows, options.maxChars);
}

export function toMessages(rows: Row[], maxChars: number): BetaMessageParam[] {
  const turns: Array<{ role: "user" | "assistant"; text: string }> = [];
  for (const row of rows) {
    const text = row.direction === "outbound" ? row.body : row.body?.trim() || MEDIA_PLACEHOLDER[row.type];
    if (!text) continue; // reações e mensagens vazias
    const role = row.direction === "inbound" ? "user" : "assistant";
    const last = turns.at(-1);
    if (last?.role === role) last.text += `\n${text}`;
    else turns.push({ role, text });
  }

  // A API exige começar com o paciente; e a conversa precisa terminar nele.
  const startsWithAssistant = () => turns[0]?.role === "assistant";
  while (startsWithAssistant()) turns.shift();
  while (turns.at(-1)?.role === "assistant") turns.pop();

  let total = turns.reduce((sum, turn) => sum + turn.text.length, 0);
  while (turns.length > 1 && total > maxChars) {
    total -= turns.shift()!.text.length;
    while (startsWithAssistant()) total -= turns.shift()!.text.length;
  }
  // Uma única mensagem enorme do paciente: mantém o final dela.
  const only = turns.length === 1 ? turns[0] : undefined;
  if (only && only.text.length > maxChars) only.text = only.text.slice(-maxChars);

  return turns.map((turn) => ({ role: turn.role, content: turn.text }));
}
