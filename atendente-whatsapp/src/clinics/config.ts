import { z } from "zod";
import type { Db } from "../db/db.js";
import { encryptSecret } from "../lib/crypto.js";

/**
 * Arquivo de configuração de uma clínica (clinics/<slug>.yaml). Nenhum segredo vai no
 * arquivo: o token da Meta é lido da variável de ambiente indicada em access_token_env.
 * As próximas fases acrescentam serviços, preços, horários, profissionais etc.
 */
export const clinicConfigSchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use letras minúsculas, números e hífens"),
  name: z.string().min(2),
  timezone: z.string().default("America/Sao_Paulo"),
  active: z.boolean().default(true),
  whatsapp: z.strictObject({
    phone_number_id: z.coerce.string().regex(/^\d+$/, "phone_number_id é numérico (veja no painel da Meta)"),
    waba_id: z.coerce.string().regex(/^\d+$/).optional(),
    display_phone: z.string().optional(),
    access_token_env: z.string().regex(/^[A-Z][A-Z0-9_]*$/, "nome de variável de ambiente, ex.: CLINICA_X_WHATSAPP_TOKEN"),
  }),
});

export type ClinicConfig = z.infer<typeof clinicConfigSchema>;

export async function upsertClinic(
  db: Db,
  config: ClinicConfig,
  options: { accessToken: string; encryptionKey: string },
): Promise<{ clinicId: string; channelId: string }> {
  if (!Intl.supportedValuesOf("timeZone").includes(config.timezone)) {
    throw new Error(`Fuso horário desconhecido: ${config.timezone}`);
  }
  const ciphertext = encryptSecret(options.accessToken, options.encryptionKey);

  return db.transaction(async (tx) => {
    const clinic = await tx.query<{ id: string }>(
      `insert into clinics (slug, name, timezone, active) values ($1, $2, $3, $4)
       on conflict (slug) do update
         set name = excluded.name, timezone = excluded.timezone, active = excluded.active, updated_at = now()
       returning id`,
      [config.slug, config.name, config.timezone, config.active],
    );
    const clinicId = clinic.rows[0]!.id;

    const existing = await tx.query<{ clinic_id: string }>(
      `select clinic_id from clinic_channels where phone_number_id = $1`,
      [config.whatsapp.phone_number_id],
    );
    if (existing.rows[0] && existing.rows[0].clinic_id !== clinicId) {
      throw new Error(`O phone_number_id ${config.whatsapp.phone_number_id} já pertence a outra clínica`);
    }

    const channel = await tx.query<{ id: string }>(
      `insert into clinic_channels (clinic_id, phone_number_id, waba_id, display_phone, access_token_ciphertext)
       values ($1, $2, $3, $4, $5)
       on conflict (phone_number_id) do update
         set waba_id = excluded.waba_id, display_phone = excluded.display_phone,
             access_token_ciphertext = excluded.access_token_ciphertext, active = true, updated_at = now()
       returning id`,
      [
        clinicId,
        config.whatsapp.phone_number_id,
        config.whatsapp.waba_id ?? null,
        config.whatsapp.display_phone ?? null,
        ciphertext,
      ],
    );
    return { clinicId, channelId: channel.rows[0]!.id };
  });
}
