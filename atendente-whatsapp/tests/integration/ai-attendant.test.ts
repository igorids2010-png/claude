import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { afterEach, describe, expect, it } from "vitest";
import { AI_UNAVAILABLE_TEXT, COULD_NOT_ANSWER_TEXT, RATE_LIMITED_TEXT } from "../../src/ai/claude-responder.js";
import { emergencyText } from "../../src/ai/safety.js";
import { disclosureText } from "../../src/conversations/texts.js";
import { refusal, text, toolUse } from "../helpers/fake-claude.js";
import { createHarness, TEAM_WA_ID, type Harness } from "../helpers/harness.js";
import { mediaMessage, textMessage, webhookPayload } from "../helpers/payloads.js";

let h: Harness;
afterEach(async () => {
  await h?.close();
});

const DISCLOSURE = disclosureText("Clínica Teste");
const say = async (...bodies: string[]) => {
  for (const body of bodies) await h.postWebhook(webhookPayload({ messages: [textMessage(body)] }));
};
/** Roda o worker até a fila esvaziar (respostas e entregas de alertas). */
const drain = async () => {
  for (let i = 0; i < 10 && (await h.worker.runOnce()) > 0; i++);
};
const toPatient = () =>
  h.graph.calls.filter((c) => c.body.type === "text" && c.body.to !== TEAM_WA_ID).map((c) => (c.body.text as { body: string }).body);
const toTeam = () =>
  h.graph.calls.filter((c) => c.body.to === TEAM_WA_ID).map((c) => (c.body.text as { body: string } | undefined)?.body ?? c.body);
const alerts = async () =>
  (await h.db.query<{ kind: string; delivery_status: string }>("select kind, delivery_status from staff_alerts order by created_at")).rows;
const contentOf = (m: BetaMessageParam) => (typeof m.content === "string" ? m.content : m.content);

describe("atendente com IA", () => {
  it("responde com o Claude e monta a requisição corretamente", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(text("A avaliação custa R$ 150,00 e dura 50 minutos. Quer agendar?"));
    await say("quanto custa a avaliação?");
    await drain();

    expect(toPatient()).toEqual([DISCLOSURE, "A avaliação custa R$ 150,00 e dura 50 minutos. Quer agendar?"]);

    const request = h.claude.requests[0]!;
    expect(request.model).toBe("claude-fable-5-1");
    expect(request.output_config).toEqual({ effort: "high" });
    expect(request.fallbacks).toBe("default");
    expect(request.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(request.tool_choice).toEqual({ type: "auto" });
    expect(request.thinking).toBeUndefined();
    expect(request.tools?.every((t) => "strict" in t && t.strict === true)).toBe(true);

    const system = request.system as Array<{ text: string; cache_control?: unknown }>;
    expect(system[0]!.cache_control).toEqual({ type: "ephemeral" });
    expect(system[0]!.text).toContain("Avaliação fisioterapêutica [avaliacao]: R$");

    const messages = request.messages;
    expect(messages[0]).toEqual({ role: "user", content: "quanto custa a avaliação?" });
    expect(messages.at(-1)?.role).toBe("system");
    expect(String(contentOf(messages.at(-1)!))).toContain("primeiro contato");
  });

  it("usa o histórico da conversa nas respostas seguintes", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(text("Olá! Como posso ajudar?"), text("Atendemos Unimed e Bradesco Saúde."));
    await say("oi");
    await drain();
    await h.postWebhook(webhookPayload({ messages: [mediaMessage("audio")] }));
    await say("vcs aceitam convenio?");
    await drain();

    const second = h.claude.requests[1]!.messages;
    expect(second.slice(0, -1)).toEqual([
      { role: "user", content: "oi" },
      { role: "assistant", content: `${DISCLOSURE}\nOlá! Como posso ajudar?` },
      { role: "user", content: "[o paciente enviou um áudio]\nvcs aceitam convenio?" },
    ]);
    expect(String(contentOf(second.at(-1)!))).not.toContain("primeiro contato");
    expect(toPatient().slice(-2)).toEqual([
      "Por enquanto eu só consigo ler mensagens de texto 🙏 Pode me escrever aqui o que você precisa?",
      "Atendemos Unimed e Bradesco Saúde.",
    ]);
  });

  it("ferramentas: o conteúdo da resposta (com raciocínio) volta inalterado e o alerta chega à equipe", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(
      toolUse([{ name: "notify_team", input: { reason: "unanswered_question", summary: "Pergunta se a clínica emite nota fiscal." } }]),
      text("Vou confirmar com a equipe e te retorno por aqui."),
    );
    await say("vcs emitem nota fiscal?");
    await drain();

    expect(toPatient().at(-1)).toBe("Vou confirmar com a equipe e te retorno por aqui.");
    expect(await alerts()).toEqual([{ kind: "unanswered_question", delivery_status: "sent" }]);
    const [teamMessage] = toTeam();
    expect(teamMessage).toContain("Dúvida que o atendente não soube responder");
    expect(teamMessage).toContain("+55 11 99999-0000");
    expect(teamMessage).toContain("nota fiscal");
    expect(teamMessage).toMatch(/Conversa: #[0-9A-F]{5}/);

    const followUp = h.claude.requests[1]!.messages;
    const assistant = followUp.at(-2)!;
    expect(assistant.role).toBe("assistant");
    expect((assistant.content as Array<{ type: string }>).map((b) => b.type)).toEqual(["thinking", "tool_use"]);
    const results = followUp.at(-1)!.content as Array<{ type: string; content: string }>;
    expect(results[0]).toMatchObject({ type: "tool_result", content: "Equipe avisada." });
    // A mensagem de sistema com o horário continua no mesmo lugar (prefixo intacto).
    expect(followUp.at(-3)!.role).toBe("system");
  });

  it("não repete o alerta se o modelo chamar a ferramenta duas vezes para a mesma mensagem", async () => {
    h = await createHarness({ responder: "claude" });
    const call = { name: "notify_team", input: { reason: "other", summary: "Quer saber se pode levar acompanhante." } };
    h.claude.respond(toolUse([call]), toolUse([call]), text("Já avisei a equipe, eles te confirmam."));
    await say("posso levar acompanhante?");
    await drain();
    expect(await alerts()).toHaveLength(1);
    const second = h.claude.requests[2]!.messages.at(-1)!.content as Array<{ content: string }>;
    expect(second[0]!.content).toBe("A equipe já tinha sido avisada sobre isso.");
  });

  it("API do Claude fora do ar: mensagem padrão ao paciente e alerta para a equipe, sem nova tentativa", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.fail(529);
    await say("oi, bom dia");
    await drain();
    expect(toPatient()).toEqual([DISCLOSURE, AI_UNAVAILABLE_TEXT]);
    expect(await alerts()).toEqual([{ kind: "ai_failure", delivery_status: "sent" }]);
    const jobs = await h.db.query<{ type: string; status: string }>("select type, status from jobs order by created_at");
    expect(jobs.rows.every((j) => j.status === "done")).toBe(true);
  });

  it("recusa do modelo: diz que vai confirmar com a equipe e avisa", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(refusal());
    await say("uma pergunta estranha");
    await drain();
    expect(toPatient().at(-1)).toBe(COULD_NOT_ANSWER_TEXT);
    expect((await alerts())[0]?.kind).toBe("unanswered_question");
  });

  it("emergência: se a IA não citar o SAMU, o sistema envia a orientação e avisa a equipe", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(text("Sinto muito! Posso ajudar com mais alguma coisa?"));
    await say("meu pai está com dor no peito e muito suado");
    await drain();
    expect(toPatient()).toEqual([DISCLOSURE, emergencyText("medical"), "Sinto muito! Posso ajudar com mais alguma coisa?"]);
    expect((await alerts()).map((a) => a.kind)).toEqual(["emergency"]);
    expect(toTeam()[0]).toContain("EMERGÊNCIA");
  });

  it("emergência bem conduzida pela IA: sem mensagem duplicada e alerta único", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(
      toolUse([{ name: "notify_team", input: { reason: "emergency", summary: "Pai com dor no peito." } }]),
      text("Ligue agora para o SAMU (192). Já avisei a nossa equipe."),
    );
    await say("meu pai está com dor no peito");
    await drain();
    expect(toPatient()).toEqual([DISCLOSURE, "Ligue agora para o SAMU (192). Já avisei a nossa equipe."]);
    expect(await alerts()).toHaveLength(1);
  });

  it("emergência com a IA fora do ar: orientação de emergência em vez da mensagem genérica", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.fail(500);
    await say("minha mãe desmaiou");
    await drain();
    expect(toPatient()).toEqual([DISCLOSURE, emergencyText("medical")]);
    expect((await alerts()).map((a) => a.kind).sort()).toEqual(["ai_failure", "emergency"]);
  });

  it("limite por conversa: para de chamar a IA e avisa uma vez só", async () => {
    h = await createHarness({ responder: "claude", maxCallsPerConversationPerHour: 2 });
    h.claude.respond(text("r1"), text("r2"));
    await say("1");
    await drain();
    await say("2");
    await drain();
    await say("3");
    await drain();
    await say("4");
    await drain();
    expect(h.claude.requests).toHaveLength(2);
    expect(toPatient().filter((t) => t === RATE_LIMITED_TEXT)).toHaveLength(1);
  });

  it("registra o uso de tokens por clínica, com o modelo que respondeu", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(
      toolUse([{ name: "notify_team", input: { reason: "scheduling_request", summary: "Quer avaliação sexta de manhã." } }]),
      text("Anotei! A equipe confirma o horário por aqui.", { model: "claude-opus-5" }),
    );
    await say("quero marcar avaliação sexta de manhã");
    await drain();
    const usage = await h.db.query<{ model: string; input_tokens: number; output_tokens: number; cache_read_input_tokens: number }>(
      "select model, input_tokens, output_tokens, cache_read_input_tokens from ai_usage order by created_at",
    );
    expect(usage.rows.map((r) => r.model)).toEqual(["claude-fable-5-1", "claude-opus-5"]);
    const monthly = await h.db.query<{ calls: string; input_tokens: string }>(
      "select sum(calls)::text as calls, sum(input_tokens)::text as input_tokens from clinic_monthly_ai_usage where clinic_id = $1",
      [h.clinicId],
    );
    expect(monthly.rows[0]).toEqual({ calls: "2", input_tokens: "2400" });
  });

  it("nova tentativa depois de falha no envio reaproveita a resposta, sem chamar a IA de novo", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(text("Resposta gerada uma vez."));
    await say("oi");
    h.graph.queue(
      () => ({ status: 200, json: { success: true } }),
      () => ({ status: 200, json: { messages: [{ id: "wamid.D" }] } }),
      h.graph.error(503),
      h.graph.error(503),
      h.graph.error(503),
    );
    await drain();
    expect(h.claude.requests).toHaveLength(1);
    expect(toPatient().filter((t) => t === "Resposta gerada uma vez.").length).toBeGreaterThanOrEqual(1);
    const sent = await h.db.query("select 1 from messages where body = 'Resposta gerada uma vez.' and status = 'sent'");
    expect(sent.rows).toHaveLength(1);
  });

  it("pedido de exclusão de dados é registrado e a equipe avisada", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(toolUse([{ name: "request_data_deletion", input: {} }]), text("Pedido registrado!"));
    await say("quero que apaguem meus dados");
    await drain();
    const requests = await h.db.query<{ status: string }>("select status from data_deletion_requests");
    expect(requests.rows).toEqual([{ status: "pending" }]);
    expect((await alerts())[0]?.kind).toBe("data_deletion");
  });

  it("entrada inválida de ferramenta volta como erro para o modelo corrigir", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(toolUse([{ name: "notify_team", input: { reason: "xyz", summary: "a" } }]), text("ok"));
    await say("oi");
    await drain();
    const result = h.claude.requests[1]!.messages.at(-1)!.content as Array<{ is_error: boolean }>;
    expect(result[0]!.is_error).toBe(true);
    expect(await alerts()).toHaveLength(0);
  });

  it("converte markdown para o formato do WhatsApp", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(text("## Valores\n**Avaliação**: R$ 150,00"));
    await say("valores?");
    await drain();
    expect(toPatient().at(-1)).toBe("Valores\n*Avaliação*: R$ 150,00");
  });
});

describe("entrega dos alertas para a equipe", () => {
  it("fora da janela de 24h, usa o template configurado", async () => {
    h = await createHarness({ responder: "claude", clinic: { team: { alert_whatsapp: TEAM_WA_ID, alert_template: "alerta_equipe" } } });
    h.claude.respond(
      toolUse([{ name: "notify_team", input: { reason: "other", summary: "Quer falar\ncom alguém sobre parceria." } }]),
      text("Já avisei!"),
    );
    await say("vcs fazem parceria com empresas?");
    await h.worker.runOnce(); // conversa
    h.graph.queue(h.graph.error(400, 131047));
    await drain(); // alerta
    const template = h.graph.calls.find((c) => c.body.type === "template");
    expect(template?.body.template).toMatchObject({ name: "alerta_equipe", language: { code: "pt_BR" } });
    const param = (template?.body.template as { components: Array<{ parameters: Array<{ text: string }> }> }).components[0]!.parameters[0]!.text;
    expect(param).not.toMatch(/\n/);
    expect(param).toContain("Quer falar com alguém sobre parceria.");
    expect((await alerts())[0]?.delivery_status).toBe("sent");
  });

  it("sem template, a falha fica registrada", async () => {
    h = await createHarness({ responder: "claude" });
    h.claude.respond(toolUse([{ name: "notify_team", input: { reason: "other", summary: "Paciente pediu algo fora do roteiro." } }]), text("ok"));
    await say("oi");
    await h.worker.runOnce();
    h.graph.queue(h.graph.error(400, 131047));
    await drain();
    expect((await alerts())[0]?.delivery_status).toBe("failed");
  });

  it("clínica sem número da equipe: alerta fica registrado sem envio", async () => {
    h = await createHarness({ responder: "claude", clinic: { team: {} } });
    h.claude.respond(toolUse([{ name: "notify_team", input: { reason: "other", summary: "Paciente pediu algo fora do roteiro." } }]), text("ok"));
    await say("oi");
    await drain();
    expect((await alerts())[0]?.delivery_status).toBe("no_destination");
  });
});
