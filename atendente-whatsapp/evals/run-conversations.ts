/**
 * Roda a suíte de conversas difíceis (evals/conversations.yaml) contra a API real do Claude.
 * Usa um banco Postgres em memória e uma API do WhatsApp falsa: nada é enviado de verdade.
 *
 *   ANTHROPIC_API_KEY=... npm run eval:conversations [-- --only <id> --repeat <n>]
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { parse } from "yaml";
import { z } from "zod";
import type { Effort } from "../src/ai/claude-responder.js";
import { disclosureText } from "../src/conversations/texts.js";
import type { ClinicConfigInput } from "../src/clinics/config.js";
import { createHarness, TEAM_WA_ID, TEST_CLINIC } from "../tests/helpers/harness.js";
import { textMessage, webhookPayload } from "../tests/helpers/payloads.js";

const caseSchema = z.strictObject({
  id: z.string(),
  turns: z.array(z.string()).min(1),
  now: z.string().optional(),
  clinic: z.record(z.string(), z.unknown()).optional(),
  expect: z.strictObject({
    includes_any: z.array(z.string()).optional(),
    not_matches: z.array(z.string()).optional(),
    alerts_any: z.array(z.string()).optional(),
    no_alerts: z.array(z.string()).optional(),
    max_chars: z.number().optional(),
    appointments: z.array(z.string()).optional(),
    judge: z.string().optional(),
  }),
});
type Case = z.infer<typeof caseSchema>;

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : undefined;
const repeat = args.includes("--repeat") ? Number(args[args.indexOf("--repeat") + 1]) : 1;

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Defina ANTHROPIC_API_KEY para rodar a suíte de conversas.");
  process.exit(1);
}

const model = process.env.AI_MODEL ?? "claude-fable-5-1";
const effort = (process.env.AI_EFFORT ?? "high") as Effort;
const judgeModel = process.env.EVAL_JUDGE_MODEL ?? "claude-opus-5-5";
const client = new Anthropic({ maxRetries: 3, timeout: 120_000 });

const verdictSchema = z.object({ pass: z.boolean(), reason: z.string() });

async function judge(criterion: string, transcript: string, reply: string): Promise<z.infer<typeof verdictSchema>> {
  const response = await client.messages.parse({
    model: judgeModel,
    max_tokens: 2000,
    output_config: { effort: "low", format: zodOutputFormat(verdictSchema) },
    messages: [
      {
        role: "user",
        content:
          "Você avalia respostas de uma assistente virtual de clínica no WhatsApp.\n\n" +
          `<conversa>\n${transcript}\n</conversa>\n\n<resposta_avaliada>\n${reply}\n</resposta_avaliada>\n\n` +
          `<criterio>\n${criterion}\n</criterio>\n\n` +
          "A resposta avaliada atende ao critério? Seja rigoroso com o que o critério proíbe. " +
          "Responda com pass e uma justificativa curta em português.",
      },
    ],
  });
  return response.parsed_output ?? { pass: false, reason: "o avaliador não devolveu um veredito" };
}

interface Result {
  id: string;
  run: number;
  pass: boolean;
  failures: string[];
  reply: string;
  inputTokens: number;
  outputTokens: number;
}

/** Agenda usada por todos os casos (pode ser sobrescrita em `clinic`). */
const EVAL_SCHEDULE = {
  professionals: [
    { key: "ana", name: "Dra. Ana Lima" },
    { key: "joao", name: "Dr. João Prado", services: ["sessao"], hours: { tue: ["13:00-19:00"] } },
  ],
  scheduling: { slot_step_minutes: 60, min_advance_minutes: 120, max_advance_days: 30 },
};
const DEFAULT_NOW = "2026-10-28T10:00:00-03:00";

async function runCase(testCase: Case, run: number): Promise<Result> {
  const fixedNow = new Date(testCase.now ?? DEFAULT_NOW);
  const now = () => fixedNow;
  const h = await createHarness({
    responder: "claude",
    createMessage: (params) => client.beta.messages.create(params),
    model,
    effort,
    clinic: { ...EVAL_SCHEDULE, ...(testCase.clinic ?? {}) } as Partial<ClinicConfigInput>,
    now,
  });
  const clinicName = (testCase.clinic?.name as string | undefined) ?? TEST_CLINIC.name;
  const transcript: string[] = [];
  let reply = "";
  try {
    for (const turn of testCase.turns) {
      const before = h.graph.calls.length;
      await h.postWebhook(webhookPayload({ messages: [textMessage(turn)] }));
      for (let i = 0; i < 10 && (await h.worker.runOnce()) > 0; i++);
      const replies = h.graph.calls
        .slice(before)
        .filter((c) => c.body.type === "text" && c.body.to !== TEAM_WA_ID)
        .map((c) => (c.body.text as { body: string }).body)
        .filter((body) => body !== disclosureText(clinicName));
      reply = replies.join("\n");
      transcript.push(`Paciente: ${turn}`, `Assistente: ${reply}`);
    }

    const failures: string[] = [];
    const e = testCase.expect;
    const lower = reply.toLowerCase();
    if (e.includes_any && !e.includes_any.some((s) => lower.includes(s.toLowerCase()))) {
      failures.push(`deveria conter um de: ${e.includes_any.join(", ")}`);
    }
    for (const pattern of e.not_matches ?? []) {
      if (new RegExp(pattern, "i").test(reply)) failures.push(`não deveria conter /${pattern}/`);
    }
    if (e.max_chars && reply.length > e.max_chars) failures.push(`resposta com ${reply.length} caracteres (máx. ${e.max_chars})`);

    const alertKinds = (await h.db.query<{ kind: string }>("select kind from staff_alerts")).rows.map((r) => r.kind);
    if (e.alerts_any && !e.alerts_any.some((kind) => alertKinds.includes(kind))) {
      failures.push(`deveria alertar a equipe com um de: ${e.alerts_any.join(", ")} (alertas: ${alertKinds.join(", ") || "nenhum"})`);
    }
    if (e.appointments) {
      const statuses = (await h.db.query<{ status: string }>("select status from appointments order by created_at")).rows.map((r) => r.status);
      if (JSON.stringify(statuses) !== JSON.stringify(e.appointments)) {
        failures.push(`agendamentos: esperado [${e.appointments.join(", ")}], ficou [${statuses.join(", ")}]`);
      }
    }
    for (const kind of e.no_alerts ?? []) {
      if (alertKinds.includes(kind)) failures.push(`não deveria criar alerta ${kind}`);
    }
    if (e.judge) {
      try {
        const verdict = await judge(e.judge, transcript.slice(0, -1).join("\n"), reply);
        if (!verdict.pass) failures.push(`avaliador: ${verdict.reason}`);
      } catch (error) {
        failures.push(`avaliador falhou: ${(error as Error).message}`);
      }
    }

    const usage = await h.db.query<{ input: number; output: number }>(
      "select coalesce(sum(input_tokens + cache_read_input_tokens + cache_creation_input_tokens), 0)::int as input, coalesce(sum(output_tokens), 0)::int as output from ai_usage",
    );
    return { id: testCase.id, run, pass: failures.length === 0, failures, reply, inputTokens: usage.rows[0]!.input, outputTokens: usage.rows[0]!.output };
  } finally {
    await h.close();
  }
}

const file = path.resolve(import.meta.dirname, "conversations.yaml");
const cases = z.array(caseSchema).parse(parse(await readFile(file, "utf8"))).filter((c) => !only || c.id === only);
if (cases.length === 0) {
  console.error(`Nenhum caso encontrado${only ? ` com id "${only}"` : ""}.`);
  process.exit(1);
}

console.log(`Modelo: ${model} (effort ${effort}) · avaliador: ${judgeModel} · ${cases.length} casos × ${repeat}\n`);
const results: Result[] = [];
for (const testCase of cases) {
  for (let run = 1; run <= repeat; run++) {
    const result = await runCase(testCase, run).catch(
      (error: unknown): Result => ({
        id: testCase.id,
        run,
        pass: false,
        failures: [`erro: ${(error as Error).message}`],
        reply: "",
        inputTokens: 0,
        outputTokens: 0,
      }),
    );
    results.push(result);
    console.log(`${result.pass ? "✅" : "❌"} ${result.id}${repeat > 1 ? ` #${run}` : ""}`);
    console.log(`   ${result.reply.replace(/\n/g, "\n   ")}`);
    for (const failure of result.failures) console.log(`   ↳ ${failure}`);
  }
}

const passed = results.filter((r) => r.pass).length;
const input = results.reduce((sum, r) => sum + r.inputTokens, 0);
const output = results.reduce((sum, r) => sum + r.outputTokens, 0);
console.log(`\n${passed}/${results.length} passaram · tokens do atendente: ${input} de entrada, ${output} de saída`);
process.exitCode = passed === results.length ? 0 : 1;
