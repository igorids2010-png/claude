import { afterEach, describe, expect, it } from "vitest";
import { COULD_NOT_ANSWER_TEXT } from "../../src/ai/claude-responder.js";
import { HANDOFF_PATIENT_TEXT, HANDOFF_UNRESOLVED_TEXT } from "../../src/handoff/handoff.js";
import { PATIENT_WA_ID } from "../helpers/constants.js";
import { refusal, text, toolUse } from "../helpers/fake-claude.js";
import { createHarness, TEAM_WA_ID, type Harness } from "../helpers/harness.js";
import { mediaMessage, textMessage, webhookPayload } from "../helpers/payloads.js";

let h: Harness;
afterEach(async () => {
  await h?.close();
});

const patientSays = async (body: string) => {
  await h.postWebhook(webhookPayload({ messages: [textMessage(body)] }));
  await drain();
};
/** A recepção manda mensagem para o número da clínica. */
const staffSays = async (body: string, from = TEAM_WA_ID) => {
  const message = textMessage(body, { from });
  await h.postWebhook(webhookPayload({ messages: [message] }));
  await drain();
  return message;
};
const drain = async () => {
  for (let i = 0; i < 10 && (await h.worker.runOnce()) > 0; i++);
};
const sentTo = (to: string) =>
  h.graph.calls.filter((c) => c.body.type === "text" && c.body.to === to).map((c) => (c.body.text as { body: string }).body);
const conversation = async () =>
  (await h.db.query<{ status: string; short_code: string; unresolved_count: number }>("select status, short_code, unresolved_count from conversations")).rows[0]!;
const handoffs = async () =>
  (await h.db.query<{ reason: string; started_by: string; ended_by: string | null }>("select reason, started_by, ended_by from handoffs order by started_at")).rows;

describe("transferência para atendimento humano", () => {
  it("pedido explícito: transfere sem chamar a IA, responde ao paciente e avisa a recepção com o código", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(text("Olá! Como posso ajudar?"));
    await patientSays("oi, quero marcar avaliação");
    await patientSays("quero falar com uma atendente");

    expect(h.claude.requests).toHaveLength(1); // só a primeira mensagem passou pela IA
    expect(sentTo(PATIENT_WA_ID).at(-1)).toBe(HANDOFF_PATIENT_TEXT);
    const { status, short_code } = await conversation();
    expect(status).toBe("human");
    expect(await handoffs()).toEqual([{ reason: "patient_request", started_by: "patient", ended_by: null }]);

    const alert = sentTo(TEAM_WA_ID).at(-1)!;
    expect(alert).toContain("Paciente pediu atendimento humano");
    expect(alert).toContain(`Conversa: #${short_code}`);
    expect(alert).toContain("Paciente: oi, quero marcar avaliação");
    expect(alert).toContain(`#${short_code} sua mensagem`);
    expect(alert).toContain(`#${short_code} /bot`);
  });

  it("IA transfere quando o paciente está irritado (transfer_to_human)", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(
      toolUse([{ name: "transfer_to_human", input: { reason: "frustrated", summary: "Esperou 40 min e está bravo com o atraso." } }]),
      text("Sinto muito pela espera. Já chamei alguém da equipe, que continua com você por aqui."),
    );
    await patientSays("ABSURDO 40 min esperando!!!");
    expect((await conversation()).status).toBe("human");
    expect(await handoffs()).toEqual([{ reason: "frustrated", started_by: "ai", ended_by: null }]);
    expect(sentTo(TEAM_WA_ID).at(-1)).toContain("Esperou 40 min");
    expect(sentTo(PATIENT_WA_ID).at(-1)).toContain("Já chamei alguém da equipe");
  });

  it("durante o atendimento humano, o bot fica em silêncio e a recepção recebe as mensagens", async () => {
    h = await createHarness({ responder: "claude" });
    await patientSays("atendente por favor");
    const before = sentTo(PATIENT_WA_ID).length;
    const { short_code } = await conversation();

    await h.postWebhook(webhookPayload({ messages: [textMessage("é sobre meu reembolso")] }));
    await h.postWebhook(webhookPayload({ messages: [mediaMessage("audio")] }));
    await drain();

    expect(h.claude.requests).toHaveLength(0);
    expect(sentTo(PATIENT_WA_ID)).toHaveLength(before);
    const forward = sentTo(TEAM_WA_ID).at(-1)!;
    expect(forward).toContain(`💬 #${short_code}`);
    expect(forward).toContain("é sobre meu reembolso\n[áudio]");
    const forwarded = await h.db.query("select 1 from messages where direction = 'inbound' and forwarded_at is not null");
    expect(forwarded.rows).toHaveLength(2);
  });

  it("recepção responde pelo código: o paciente recebe pelo número da clínica", async () => {
    h = await createHarness({ responder: "claude" });
    await patientSays("quero falar com um humano");
    const { short_code } = await conversation();

    await staffSays(`#${short_code} Oi! Aqui é a Júlia, da recepção. Como posso ajudar?`);
    expect(sentTo(PATIENT_WA_ID).at(-1)).toBe("Oi! Aqui é a Júlia, da recepção. Como posso ajudar?");
    const staffMessage = await h.db.query<{ author: string; status: string }>("select author, status from messages where author = 'staff'");
    expect(staffMessage.rows).toEqual([{ author: "staff", status: "sent" }]);
    const activity = await h.db.query("select 1 from handoffs where last_staff_message_at is not null");
    expect(activity.rows).toHaveLength(1);
    // A mensagem da equipe não vira paciente nem conversa nova.
    expect((await h.db.query("select 1 from patients")).rows).toHaveLength(1);
  });

  it("a mesma mensagem da recepção entregue duas vezes vai ao paciente uma vez só", async () => {
    h = await createHarness({ responder: "claude" });
    await patientSays("atendente");
    const { short_code } = await conversation();
    const message = textMessage(`#${short_code} Já vou verificar.`, { from: TEAM_WA_ID });
    await h.postWebhook(webhookPayload({ messages: [message] }));
    await h.postWebhook(webhookPayload({ messages: [message] }));
    await drain();
    expect(sentTo(PATIENT_WA_ID).filter((t) => t === "Já vou verificar.")).toHaveLength(1);
  });

  it("#CÓDIGO /bot devolve ao atendente automático, que passa a ver o que a equipe disse", async () => {
    h = await createHarness({ responder: "claude" });
    await patientSays("atendente");
    const { short_code } = await conversation();
    await staffSays(`#${short_code} Seu reembolso foi aprovado ontem.`);
    await staffSays(`#${short_code} /bot`);

    expect(sentTo(TEAM_WA_ID).at(-1)).toBe(`✅ #${short_code} voltou para o atendente automático.`);
    expect((await conversation()).status).toBe("bot");
    expect((await handoffs())[0]!.ended_by).toBe("staff");

    h.claude.respond(text("De nada! Posso ajudar com mais alguma coisa?"));
    await patientSays("obrigada!");
    expect(sentTo(PATIENT_WA_ID).at(-1)).toBe("De nada! Posso ajudar com mais alguma coisa?");
    const history = JSON.stringify(h.claude.requests[0]!.messages);
    expect(history).toContain("Seu reembolso foi aprovado ontem.");
  });

  it("a recepção pode assumir uma conversa que está com o bot (e responder direto também assume)", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(text("Olá!"));
    await patientSays("oi");
    const { short_code } = await conversation();

    await staffSays(`#${short_code} /assumir`);
    expect((await conversation()).status).toBe("human");
    expect(await handoffs()).toEqual([{ reason: "staff", started_by: "staff", ended_by: null }]);
    expect(sentTo(TEAM_WA_ID).at(-1)).toContain(`Você assumiu #${short_code}`);
    // A equipe assumiu por conta própria: não recebe alerta de transferência.
    expect((await h.db.query("select 1 from staff_alerts")).rows).toHaveLength(0);

    await staffSays(`#${short_code} /bot`);
    await staffSays(`#${short_code} Oi, aqui é a Júlia!`);
    expect((await conversation()).status).toBe("human");
    expect(sentTo(PATIENT_WA_ID).at(-1)).toBe("Oi, aqui é a Júlia!");
  });

  it("/lista, /ajuda e código inexistente", async () => {
    h = await createHarness({ responder: "claude" });
    await patientSays("quero falar com atendente");
    const { short_code } = await conversation();

    await staffSays("/lista");
    expect(sentTo(TEAM_WA_ID).at(-1)).toMatch(new RegExp(`Em atendimento humano:\\n• #${short_code} \\+55 11 99999-0000 \\(desde`));
    await staffSays("bom dia");
    expect(sentTo(TEAM_WA_ID).at(-1)).toContain("Comandos da recepção");
    await staffSays("#ABCDE oi");
    expect(sentTo(TEAM_WA_ID).at(-1)).toContain("Não encontrei a conversa #ABCDE");
  });

  it("número extra da equipe (e sem o nono dígito) também é reconhecido", async () => {
    h = await createHarness({ responder: "claude", clinic: { team: { alert_whatsapp: TEAM_WA_ID, staff_whatsapp: ["5511977776666"] } } });
    await patientSays("atendente");
    const { short_code } = await conversation();
    await staffSays(`#${short_code} Oi, é a Dra. Ana.`, "551177776666");
    expect(sentTo(PATIENT_WA_ID).at(-1)).toBe("Oi, é a Dra. Ana.");
  });

  it("paciente fora da janela de 24h: a recepção é avisada de que não deu para enviar", async () => {
    h = await createHarness({ responder: "claude" });
    await patientSays("atendente");
    const { short_code } = await conversation();
    h.graph.queue(h.graph.error(400, 131047));
    await staffSays(`#${short_code} Olá?`);
    expect(sentTo(TEAM_WA_ID).at(-1)).toContain("mais de 24h");
    const failed = await h.db.query<{ status: string }>("select status from messages where author = 'staff'");
    expect(failed.rows).toEqual([{ status: "failed" }]);
  });

  it("sem resposta da equipe pelo tempo limite, o bot volta a atender", async () => {
    h = await createHarness({ responder: "claude", handoffAutoReleaseMs: 60 * 60 * 1000 });
    await patientSays("atendente");
    await h.db.query("update handoffs set started_at = now() - interval '2 hours'");

    h.claude.respond(text("Oi! Desculpe a demora. Em que posso ajudar?"));
    await patientSays("alguém aí?");
    expect(sentTo(PATIENT_WA_ID).at(-1)).toBe("Oi! Desculpe a demora. Em que posso ajudar?");
    expect((await conversation()).status).toBe("bot");
    expect((await handoffs())[0]!.ended_by).toBe("timeout");
  });

  it("duas tentativas seguidas sem resolver: a conversa vai para a equipe", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(refusal());
    await patientSays("pergunta 1");
    expect((await conversation()).unresolved_count).toBe(1);
    expect((await conversation()).status).toBe("bot");

    h.claude.respond(
      toolUse([{ name: "notify_team", input: { reason: "unanswered_question", summary: "Quer saber o CNPJ da clínica." } }]),
      text("Vou confirmar com a equipe."),
    );
    await patientSays("pergunta 2");
    expect(sentTo(PATIENT_WA_ID).slice(-2)).toEqual(["Vou confirmar com a equipe.", HANDOFF_UNRESOLVED_TEXT]);
    expect((await conversation()).status).toBe("human");
    expect(await handoffs()).toEqual([{ reason: "unresolved", started_by: "system", ended_by: null }]);
    expect(sentTo(PATIENT_WA_ID)).toContain(COULD_NOT_ANSWER_TEXT);
  });

  it("uma resposta resolvida no meio zera a contagem", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(refusal(), text("A avaliação custa R$ 150,00."), refusal());
    await patientSays("pergunta estranha");
    await patientSays("quanto custa a avaliação?");
    await patientSays("outra pergunta estranha");
    expect((await conversation()).status).toBe("bot");
    expect((await conversation()).unresolved_count).toBe(1);
  });
});
