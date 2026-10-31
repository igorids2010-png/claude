import type { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { afterEach, describe, expect, it } from "vitest";
import { fromLocal } from "../../src/lib/time.js";
import { createFakeCalendar } from "../helpers/fake-calendar.js";
import { text, toolUse } from "../helpers/fake-claude.js";
import { createHarness, TEAM_WA_ID, type Harness } from "../helpers/harness.js";
import { textMessage, webhookPayload } from "../helpers/payloads.js";

let h: Harness;
afterEach(async () => {
  await h?.close();
});

const NOW = fromLocal("2026-10-28", "07:00", "America/Sao_Paulo");

async function setup() {
  const calendar = createFakeCalendar();
  h = await createHarness({
    responder: "claude",
    now: () => NOW,
    calendar: calendar.client,
    clinic: {
      professionals: [{ key: "ana", name: "Dra. Ana", google_calendar_id: "ana@agenda" }],
      scheduling: { slot_step_minutes: 60, min_advance_minutes: 60, max_advance_days: 30 },
    },
  });
  return calendar;
}

const say = async (body: string) => {
  await h.postWebhook(webhookPayload({ messages: [textMessage(body)] }));
  for (let i = 0; i < 10 && (await h.worker.runOnce()) > 0; i++);
};
const toPatient = () =>
  h.graph.calls.filter((c) => c.body.type === "text" && c.body.to !== TEAM_WA_ID).map((c) => (c.body.text as { body: string }).body);
/** Conteúdo do último tool_result enviado ao modelo. */
const lastToolResult = (params: MessageCreateParamsNonStreaming) => {
  const blocks = params.messages.at(-1)!.content as Array<{ type: string; content: string; is_error?: boolean }>;
  return blocks.find((b) => b.type === "tool_result")!;
};
const systemTurn = (params: MessageCreateParamsNonStreaming) =>
  String(params.messages.filter((m) => m.role === "system").at(-1)!.content);

describe("agendamento conduzido pela IA", () => {
  it("consulta, propõe, espera o sim e só então confirma", async () => {
    const calendar = await setup();
    let actionId = "";
    h.claude.respond(
      toolUse([
        {
          name: "check_availability",
          input: { service_key: "avaliacao", date_from: "2026-10-31", date_to: null, period: "morning", professional_key: null },
        },
      ]),
      (params) => {
        const result = JSON.parse(lastToolResult(params).content) as { available: Array<{ times: Array<{ time: string }> }> };
        expect(result.available[0]!.times.map((t) => t.time)).toContain("09:00");
        return toolUse([
          { name: "propose_booking", input: { service_key: "avaliacao", professional_key: "ana", start: "2026-10-31T09:00", patient_name: "Maria Souza" } },
        ]);
      },
      (params) => {
        actionId = (JSON.parse(lastToolResult(params).content) as { action_id: string }).action_id;
        return text("Avaliação com a Dra. Ana no sábado, 31/10, às 09:00, para Maria Souza (R$ 150,00). Posso confirmar?");
      },
    );
    await say("quero marcar avaliação sábado de manhã, meu nome é Maria Souza");
    expect(toPatient().at(-1)).toContain("Posso confirmar?");

    // Turno seguinte: o modelo recebe a proposta pendente na mensagem de sistema.
    h.claude.respond(
      (params) => {
        const context = systemTurn(params);
        expect(context).toContain(`action_id: ${actionId}`);
        expect(context).toContain("Avaliação fisioterapêutica com Dra. Ana, sábado, 31/10 às 09:00, para Maria Souza");
        return toolUse([{ name: "confirm_pending_action", input: { action_id: actionId } }]);
      },
      (params) => {
        expect(JSON.parse(lastToolResult(params).content)).toMatchObject({ status: "confirmado" });
        return text("Pronto, está confirmado! Te esperamos no sábado às 09:00.");
      },
    );
    await say("sim");
    expect(toPatient().at(-1)).toBe("Pronto, está confirmado! Te esperamos no sábado às 09:00.");

    const appointments = await h.db.query<{ status: string; google_sync_status: string }>("select status, google_sync_status from appointments");
    expect(appointments.rows).toEqual([{ status: "scheduled", google_sync_status: "synced" }]);
    expect(calendar.inserted).toHaveLength(1);
  });

  it("se o modelo tentar confirmar no mesmo turno da proposta, a ferramenta recusa", async () => {
    await setup();
    h.claude.respond(
      toolUse([
        { name: "propose_booking", input: { service_key: "avaliacao", professional_key: "ana", start: "2026-10-31T09:00", patient_name: "Maria Souza" } },
      ]),
      (params) => {
        const actionId = (JSON.parse(lastToolResult(params).content) as { action_id: string }).action_id;
        return toolUse([{ name: "confirm_pending_action", input: { action_id: actionId } }]);
      },
      (params) => {
        const result = lastToolResult(params);
        expect(result.is_error).toBe(true);
        expect(result.content).toContain("ainda não respondeu");
        return text("Posso confirmar sábado às 09:00?");
      },
    );
    await say("marca avaliação sábado 9h, Maria Souza");
    const appointments = await h.db.query<{ status: string }>("select status from appointments");
    expect(appointments.rows).toEqual([{ status: "held" }]);
  });

  it("erro de agenda volta para o modelo explicar, sem derrubar o atendimento", async () => {
    await setup();
    h.claude.respond(
      toolUse([
        { name: "propose_booking", input: { service_key: "avaliacao", professional_key: "ana", start: "2026-10-29T09:00", patient_name: "Maria" } },
      ]),
      (params) => {
        expect(lastToolResult(params)).toMatchObject({ is_error: true });
        expect(lastToolResult(params).content).toContain("não está disponível");
        return text("Quinta a clínica não abre. Posso ver sábado ou terça?");
      },
    );
    await say("quinta 9h dá?");
    expect(toPatient().at(-1)).toBe("Quinta a clínica não abre. Posso ver sábado ou terça?");
  });

  it("o prompt traz profissionais, keys dos serviços e o fluxo de confirmação", async () => {
    await setup();
    h.claude.respond(text("Olá!"));
    await say("oi");
    const request = h.claude.requests[0]!;
    const system = (request.system as Array<{ text: string }>)[0]!.text;
    expect(system).toContain("- Dra. Ana [ana]: todos os serviços");
    expect(system).toContain("[avaliacao]");
    expect(system).toContain("Só depois que ele responder que sim, use confirm_pending_action");
    expect(request.tools?.map((t) => ("name" in t ? t.name : ""))).toContain("check_availability");
  });
});
