import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import type { Db, Queryable } from "../../src/db/db.js";
import { runMigrations } from "../../src/db/migrate.js";

let shared: Promise<Db> | undefined;

/**
 * Postgres de verdade (em WASM, na memória) com as mesmas migrations da produção.
 * Um banco por arquivo de teste (subir o PGlite leva ~2s); resetTestDb limpa os dados entre testes.
 */
export function getTestDb(): Promise<Db> {
  shared ??= createTestDb();
  return shared;
}

export async function resetTestDb(db: Db): Promise<void> {
  await db.exec("truncate clinics, jobs cascade");
}

async function createTestDb(): Promise<Db> {
  const pg = new PGlite({ extensions: { btree_gist } });
  const wrap = (target: Pick<PGlite, "query">): Queryable => ({
    async query<T>(sql: string, params: unknown[] = []) {
      const result = await target.query<T>(sql, params);
      return { rows: result.rows };
    },
  });
  const db: Db = {
    ...wrap(pg),
    transaction: (fn) => pg.transaction((tx) => fn(wrap(tx))),
    exec: async (sql) => {
      await pg.exec(sql);
    },
    close: () => pg.close(),
  };
  await runMigrations(db, path.resolve(import.meta.dirname, "../../supabase/migrations"));
  return db;
}
