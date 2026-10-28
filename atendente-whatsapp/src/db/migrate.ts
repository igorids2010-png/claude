import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Db } from "./db.js";

/**
 * Aplica, em ordem, os arquivos .sql de supabase/migrations que ainda não rodaram.
 * O nome do arquivo segue o padrão do Supabase CLI (<timestamp>_<nome>.sql), então
 * as mesmas migrations também podem ser aplicadas com `supabase db push`.
 */
export async function runMigrations(db: Db, directory: string): Promise<string[]> {
  await db.exec(`
    create table if not exists app_schema_migrations (
      name        text primary key,
      applied_at  timestamptz not null default now()
    );
    alter table app_schema_migrations enable row level security;
  `);

  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  const { rows } = await db.query<{ name: string }>("select name from app_schema_migrations");
  const applied = new Set(rows.map((row) => row.name));

  const newlyApplied: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    if (!/^[\w.-]+$/.test(file)) throw new Error(`Nome de migration inválido: ${file}`);
    const sql = await readFile(path.join(directory, file), "utf8");
    // Uma string com vários comandos roda numa única transação implícita no Postgres:
    // se qualquer comando falhar, nada da migration (nem o registro dela) fica gravado.
    await db.exec(`${sql}\n;\ninsert into app_schema_migrations (name) values ('${file}');`);
    newlyApplied.push(file);
  }
  return newlyApplied;
}
