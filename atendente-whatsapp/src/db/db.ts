import pg from "pg";

export interface QueryResult<T> {
  rows: T[];
}

/** O mínimo que os repositórios precisam: uma query parametrizada ($1, $2...). */
export interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}

export interface Db extends Queryable {
  /** Executa fn numa transação; faz rollback se fn lançar erro. */
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
  /** Executa SQL com vários comandos (usado pelas migrations). */
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

export interface PostgresOptions {
  connectionString: string;
  ssl: boolean;
  /** Certificado CA do Supabase (PEM). Com ele, o certificado do servidor é verificado. */
  sslCa?: string | undefined;
  max: number;
}

/** Conexão com o Postgres do Supabase (use a URL do pooler em modo sessão, porta 5432). */
export function createPostgresDb(options: PostgresOptions): Db {
  const pool = new pg.Pool({
    connectionString: options.connectionString,
    ssl: !options.ssl
      ? false
      : options.sslCa
        ? { ca: options.sslCa, rejectUnauthorized: true }
        : { rejectUnauthorized: false },
    max: options.max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  return {
    async query<T>(sql: string, params: unknown[] = []) {
      const result = await pool.query(sql, params);
      return { rows: result.rows as T[] };
    },
    async transaction<T>(fn: (tx: Queryable) => Promise<T>) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        const tx: Queryable = {
          async query<R>(sql: string, params: unknown[] = []) {
            const result = await client.query(sql, params);
            return { rows: result.rows as R[] };
          },
        };
        const value = await fn(tx);
        await client.query("commit");
        return value;
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
    async exec(sql: string) {
      await pool.query(sql);
    },
    async close() {
      await pool.end();
    },
  };
}
