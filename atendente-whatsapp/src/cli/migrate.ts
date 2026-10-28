import path from "node:path";
import { createPostgresDb } from "../db/db.js";
import { runMigrations } from "../db/migrate.js";

/** Aplica as migrations de supabase/migrations no banco de DATABASE_URL. */
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Defina DATABASE_URL (veja o .env.example).");
  process.exit(1);
}

const db = createPostgresDb({
  connectionString: url,
  ssl: process.env.DATABASE_SSL !== "false",
  sslCa: process.env.DATABASE_SSL_CA,
  max: 1,
});

try {
  const applied = await runMigrations(db, path.resolve(process.cwd(), "supabase/migrations"));
  console.log(applied.length ? `Migrations aplicadas:\n  ${applied.join("\n  ")}` : "Banco já está atualizado.");
} catch (error) {
  console.error("Falha ao aplicar migrations:", (error as Error).message);
  process.exitCode = 1;
} finally {
  await db.close();
}
