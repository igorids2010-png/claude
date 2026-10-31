import { loadEnv } from "../config/env.js";
import { createPostgresDb } from "../db/db.js";
import { normalizeWaId } from "../handoff/phone.js";
import { releaseHandoff } from "../handoff/handoff.js";

/**
 * Devolve uma conversa ao atendente automático (alternativa ao comando "#CÓDIGO /bot").
 *   npm run conversation:release -- <slug-da-clinica> <telefone-ou-#código>
 */
const [slug, who] = process.argv.slice(2);
if (!slug || !who) {
  console.error("Uso: npm run conversation:release -- <slug-da-clinica> <telefone com DDI, ou #CÓDIGO>");
  process.exit(1);
}

const env = loadEnv();
const db = createPostgresDb({ connectionString: env.DATABASE_URL, ssl: env.DATABASE_SSL, sslCa: env.DATABASE_SSL_CA, max: 1 });
try {
  const byCode = who.startsWith("#");
  const { rows } = await db.query<{ id: string; short_code: string; wa_id: string }>(
    `select cv.id, cv.short_code, p.wa_id from conversations cv
     join clinics c on c.id = cv.clinic_id join patients p on p.id = cv.patient_id
     where c.slug = $1 and cv.status = 'human'`,
    [slug],
  );
  const match = rows.find((r) => (byCode ? r.short_code === who.slice(1).toUpperCase() : normalizeWaId(r.wa_id) === normalizeWaId(who)));
  if (!match) {
    console.error("Nenhuma conversa em atendimento humano encontrada com esses dados.");
    process.exitCode = 1;
  } else {
    await releaseHandoff(db, match.id, "cli");
    console.log(`Conversa #${match.short_code} devolvida ao atendente automático.`);
  }
} finally {
  await db.close();
}
