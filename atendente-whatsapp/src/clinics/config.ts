import { z } from "zod";
import type { Db, Queryable } from "../db/db.js";
import { encryptSecret } from "../lib/crypto.js";

/**
 * Arquivo de configuração de uma clínica (clinics/<slug>.yaml). Nenhum segredo vai no
 * arquivo: o token da Meta é lido da variável de ambiente indicada em access_token_env.
 *
 * Tudo o que o atendente diz sobre a clínica (preços, horários, serviços, convênios,
 * políticas) sai daqui. O que não estiver aqui, ele não informa.
 */

export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type WeekdayKey = (typeof WEEKDAYS)[number];

const timeRange = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/, 'formato "HH:MM-HH:MM", ex.: "08:00-12:00"')
  .refine((value) => {
    const [opens, closes] = value.split("-");
    return opens! < closes!;
  }, "o horário de abertura precisa ser antes do fechamento");

const serviceSchema = z.strictObject({
  key: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use letras minúsculas, números e hífens"),
  name: z.string().min(2),
  description: z.string().optional(),
  /** Em reais. Omitido = o atendente não informa o valor e diz que a equipe confirma. */
  price: z.number().nonnegative().optional(),
  /** Complemento do preço, ex.: "a partir de", "por sessão", "pacote com 10 sessões". */
  price_note: z.string().optional(),
  duration_minutes: z.number().int().min(5).max(600),
  /** Intervalo de preparo/limpeza depois do atendimento (usado na agenda, Fase 3). */
  interval_after_minutes: z.number().int().min(0).max(240).default(0),
  active: z.boolean().default(true),
});

export const clinicConfigSchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use letras minúsculas, números e hífens"),
  name: z.string().min(2),
  specialty: z.enum(["fisioterapia", "odontologia", "estetica", "veterinaria", "outra"]).default("outra"),
  timezone: z.string().default("America/Sao_Paulo"),
  active: z.boolean().default(true),
  address: z.string().optional(),
  maps_url: z.url().optional(),
  phone: z.string().optional(),
  whatsapp: z.strictObject({
    phone_number_id: z.coerce.string().regex(/^\d+$/, "phone_number_id é numérico (veja no painel da Meta)"),
    waba_id: z.coerce.string().regex(/^\d+$/).optional(),
    display_phone: z.string().optional(),
    access_token_env: z.string().regex(/^[A-Z][A-Z0-9_]*$/, "nome de variável de ambiente, ex.: CLINICA_X_WHATSAPP_TOKEN"),
  }),
  team: z
    .strictObject({
      /** WhatsApp da recepção que recebe os alertas, só dígitos com DDI: 5511999990000. */
      alert_whatsapp: z.coerce.string().regex(/^\d{10,15}$/, "só dígitos, com DDI e DDD: 5511999990000").optional(),
      /** Template aprovado na Meta (1 variável no corpo) para avisar fora da janela de 24h. */
      alert_template: z.string().regex(/^[a-z0-9_]+$/).optional(),
    })
    .default({}),
  services: z
    .array(serviceSchema)
    .default([])
    .refine((services) => new Set(services.map((s) => s.key)).size === services.length, "há serviços com key repetida"),
  business_hours: z.partialRecord(z.enum(WEEKDAYS), z.array(timeRange)).default({}),
  insurance: z
    .strictObject({
      accepted: z.array(z.string().min(1)).default([]),
      notes: z.string().optional(),
    })
    .default({ accepted: [] }),
  policies: z
    .strictObject({
      cancellation: z.string().optional(),
      payment: z.string().optional(),
    })
    .default({}),
  /** Outras informações que o atendente pode usar (estacionamento, acessibilidade...). */
  extra_info: z.string().optional(),
});

export type ClinicConfig = z.infer<typeof clinicConfigSchema>;
export type ClinicConfigInput = z.input<typeof clinicConfigSchema>;

export async function upsertClinic(
  db: Db,
  input: ClinicConfigInput,
  options: { accessToken: string; encryptionKey: string },
): Promise<{ clinicId: string; channelId: string }> {
  const config = clinicConfigSchema.parse(input);
  if (!Intl.supportedValuesOf("timeZone").includes(config.timezone)) {
    throw new Error(`Fuso horário desconhecido: ${config.timezone}`);
  }
  const ciphertext = encryptSecret(options.accessToken, options.encryptionKey);

  return db.transaction(async (tx) => {
    const clinic = await tx.query<{ id: string }>(
      `insert into clinics (slug, name, specialty, timezone, active, address, maps_url, phone_display,
                            cancellation_policy, payment_methods, insurance_notes, extra_info,
                            team_alert_wa_id, team_alert_template)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       on conflict (slug) do update set
         name = excluded.name, specialty = excluded.specialty, timezone = excluded.timezone,
         active = excluded.active, address = excluded.address, maps_url = excluded.maps_url,
         phone_display = excluded.phone_display, cancellation_policy = excluded.cancellation_policy,
         payment_methods = excluded.payment_methods, insurance_notes = excluded.insurance_notes,
         extra_info = excluded.extra_info, team_alert_wa_id = excluded.team_alert_wa_id,
         team_alert_template = excluded.team_alert_template, updated_at = now()
       returning id`,
      [
        config.slug,
        config.name,
        config.specialty,
        config.timezone,
        config.active,
        config.address ?? null,
        config.maps_url ?? null,
        config.phone ?? null,
        config.policies.cancellation ?? null,
        config.policies.payment ?? null,
        config.insurance.notes ?? null,
        config.extra_info ?? null,
        config.team.alert_whatsapp ?? null,
        config.team.alert_template ?? null,
      ],
    );
    const clinicId = clinic.rows[0]!.id;

    const channelId = await upsertChannel(tx, clinicId, config, ciphertext);
    await replaceServices(tx, clinicId, config);
    await replaceBusinessHours(tx, clinicId, config);

    await tx.query(`delete from insurance_plans where clinic_id = $1`, [clinicId]);
    for (const name of config.insurance.accepted) {
      await tx.query(`insert into insurance_plans (clinic_id, name) values ($1, $2) on conflict do nothing`, [clinicId, name]);
    }

    return { clinicId, channelId };
  });
}

async function upsertChannel(tx: Queryable, clinicId: string, config: ClinicConfig, ciphertext: string): Promise<string> {
  const existing = await tx.query<{ clinic_id: string }>(`select clinic_id from clinic_channels where phone_number_id = $1`, [
    config.whatsapp.phone_number_id,
  ]);
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
    [clinicId, config.whatsapp.phone_number_id, config.whatsapp.waba_id ?? null, config.whatsapp.display_phone ?? null, ciphertext],
  );
  return channel.rows[0]!.id;
}

/** Serviços são atualizados pela key; os que saíram do arquivo ficam inativos (agendamentos antigos apontam para eles). */
async function replaceServices(tx: Queryable, clinicId: string, config: ClinicConfig): Promise<void> {
  for (const [index, service] of config.services.entries()) {
    await tx.query(
      `insert into services (clinic_id, key, name, description, price_cents, price_note, duration_minutes,
                             interval_after_minutes, sort_order, active)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       on conflict (clinic_id, key) do update set
         name = excluded.name, description = excluded.description, price_cents = excluded.price_cents,
         price_note = excluded.price_note, duration_minutes = excluded.duration_minutes,
         interval_after_minutes = excluded.interval_after_minutes, sort_order = excluded.sort_order,
         active = excluded.active, updated_at = now()`,
      [
        clinicId,
        service.key,
        service.name,
        service.description ?? null,
        service.price === undefined ? null : Math.round(service.price * 100),
        service.price_note ?? null,
        service.duration_minutes,
        service.interval_after_minutes,
        index,
        service.active,
      ],
    );
  }
  await tx.query(`update services set active = false, updated_at = now() where clinic_id = $1 and not (key = any($2::text[]))`, [
    clinicId,
    config.services.map((service) => service.key),
  ]);
}

async function replaceBusinessHours(tx: Queryable, clinicId: string, config: ClinicConfig): Promise<void> {
  await tx.query(`delete from business_hours where clinic_id = $1`, [clinicId]);
  for (const [day, ranges] of Object.entries(config.business_hours)) {
    const weekday = WEEKDAYS.indexOf(day as WeekdayKey);
    for (const range of ranges ?? []) {
      const [opens, closes] = range.split("-");
      await tx.query(`insert into business_hours (clinic_id, weekday, opens_at, closes_at) values ($1, $2, $3, $4)`, [
        clinicId,
        weekday,
        opens,
        closes,
      ]);
    }
  }
}
