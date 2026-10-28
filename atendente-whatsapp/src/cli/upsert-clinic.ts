import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { clinicConfigSchema, upsertClinic } from "../clinics/config.js";
import { loadEnv } from "../config/env.js";
import { createPostgresDb } from "../db/db.js";

/**
 * Cadastra ou atualiza uma clínica a partir de um arquivo YAML ou JSON.
 *   npm run clinic:upsert -- clinics/minha-clinica.yaml
 */
const file = process.argv[2];
if (!file) {
  console.error("Uso: npm run clinic:upsert -- clinics/<arquivo>.yaml");
  process.exit(1);
}

const env = loadEnv();
const parsed = clinicConfigSchema.safeParse(parse(await readFile(file, "utf8")));
if (!parsed.success) {
  console.error(`Configuração inválida em ${file}:`);
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}

const config = parsed.data;
const accessToken = process.env[config.whatsapp.access_token_env];
if (!accessToken) {
  console.error(`A variável ${config.whatsapp.access_token_env} (token da Meta desta clínica) não está definida.`);
  process.exit(1);
}

const db = createPostgresDb({ connectionString: env.DATABASE_URL, ssl: env.DATABASE_SSL, sslCa: env.DATABASE_SSL_CA, max: 1 });
try {
  const { clinicId } = await upsertClinic(db, config, { accessToken, encryptionKey: env.ENCRYPTION_KEY });
  console.log(`Clínica "${config.name}" salva (id ${clinicId}).`);
} catch (error) {
  console.error("Falha ao salvar a clínica:", (error as Error).message);
  process.exitCode = 1;
} finally {
  await db.close();
}
