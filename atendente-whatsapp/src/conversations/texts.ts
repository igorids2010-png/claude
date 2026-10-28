/** Textos fixos enviados ao paciente. As Fases 2 e 6 tornam parte deles configurável por clínica. */

/** LGPD: na primeira resposta o paciente fica sabendo que o atendimento é automatizado. */
export function disclosureText(clinicName: string): string {
  return (
    `Olá! 👋 Aqui é a assistente virtual da ${clinicName}. ` +
    "Este atendimento é automatizado; sempre que precisar, uma pessoa da nossa equipe assume a conversa. " +
    "Seus dados são usados só para o seu atendimento, e você pode pedir a exclusão deles quando quiser."
  );
}

export const MEDIA_NOT_SUPPORTED_TEXT =
  "Por enquanto eu só consigo ler mensagens de texto 🙏 Pode me escrever aqui o que você precisa?";

/** Resposta provisória da Fase 1; a Fase 2 troca pelo atendente com IA. */
export const PLACEHOLDER_REPLY_TEXT = "Recebi sua mensagem! Em instantes te respondo por aqui.";
