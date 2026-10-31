import { z } from "zod";
import type { Db, Queryable } from "../db/db.js";
import { encryptSecret } from "../lib/crypto.js";
import { fromLocal } from "../lib/time.js";

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

const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'formato "AAAA-MM-DDTHH:MM", ex.: "2026-12-24T12:00"');

const professionalSchema = z.strictObject({
  key: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use letras minúsculas, números e hífens"),
  name: z.string().min(2),
  /** ID da agenda do Google (geralmente o e-mail), compartilhada com a conta de serviço. */
  google_calendar_id: z.string().min(3).optional(),
  /** Keys dos serviços que ele atende. Omitido = todos. */
  services: z.array(z.string()).optional(),
  /** Horário próprio. Omitido = horário da clínica. Sempre limitado ao horário da clínica. */
  hours: z.partialRecord(z.enum(WEEKDAYS), z.array(timeRange)).optional(),
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
  professionals: z
    .array(professionalSchema)
    .default([])
    .refine((list) => new Set(list.map((p) => p.key)).size === list.length, "há profissionais com key repetida"),
  scheduling: z
    .strictObject({
      /** Grade dos horários oferecidos: 30 = 08:00, 08:30, 09:00... */
      slot_step_minutes: z.number().int().min(5).max(240).default(30),
      /** Antecedência mínima para marcar. */
      min_advance_minutes: z.number().int().min(0).max(10080).default(120),
      /** Até quantos dias à frente oferecer horários. */
      max_advance_days: z.number().int().min(1).max(365).default(60),
    })
    .default({ slot_step_minutes: 30, min_advance_minutes: 120, max_advance_days: 60 }),
  holidays: z
    .strictObject({
      /** Feriados nacionais automáticos (inclui Sexta-feira Santa). */
      national: z.boolean().default(true),
      /** Feriados locais, emendas e dias sem atendimento. */
      dates: z
        .array(
          z.union([
            z.iso.date(),
            z.strictObject({ date: z.iso.date(), name: z.string().optional() }),
          ]),
        )
        .default([]),
    })
    .default({ national: true, dates: [] }),
  /** Períodos sem atendimento (férias, reforma). Sem `professional` = clínica toda. */
  blocks: z
    .array(
      z.strictObject({
        start: localDateTime,
        end: localDateTime,
        professional: z.string().optional(),
        reason: z.string().optional(),
      }),
    )
    .default([]),
}).superRefine((config, ctx) => {
  const serviceKeys = new Set(config.services.map((s) => s.key));
  const professionalKeys = new Set(config.professionals.map((p) => p.key));
  config.professionals.forEach((professional, index) => {
    for (const key of professional.services ?? []) {
      if (!serviceKeys.has(key)) {
        ctx.addIssue({ code: "custom", path: ["professionals", index, "services"], message: `serviço "${key}" não existe` });
      }
    }
  });
  config.blocks.forEach((block, index) => {
    if (block.start >= block.end) ctx.addIssue({ code: "custom", path: ["blocks", index], message: "start precisa ser antes de end" });
    if (block.professional && !professionalKeys.has(block.professional)) {
      ctx.addIssue({ code: "custom", path: ["blocks", index, "professional"], message: `profissional "${block.professional}" não existe` });
    }
  });
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
                            team_alert_wa_id, team_alert_template, slot_step_minutes, min_advance_minutes,
                            max_advance_days, national_holidays)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       on conflict (slug) do update set
         name = excluded.name, specialty = excluded.specialty, timezone = excluded.timezone,
         active = excluded.active, address = excluded.address, maps_url = excluded.maps_url,
         phone_display = excluded.phone_display, cancellation_policy = excluded.cancellation_policy,
         payment_methods = excluded.payment_methods, insurance_notes = excluded.insurance_notes,
         extra_info = excluded.extra_info, team_alert_wa_id = excluded.team_alert_wa_id,
         team_alert_template = excluded.team_alert_template, slot_step_minutes = excluded.slot_step_minutes,
         min_advance_minutes = excluded.min_advance_minutes, max_advance_days = excluded.max_advance_days,
         national_holidays = excluded.national_holidays, updated_at = now()
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
        config.scheduling.slot_step_minutes,
        config.scheduling.min_advance_minutes,
        config.scheduling.max_advance_days,
        config.holidays.national,
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

    await replaceProfessionals(tx, clinicId, config);
    await tx.query(`delete from holidays where clinic_id = $1`, [clinicId]);
    for (const entry of config.holidays.dates) {
      const holiday = typeof entry === "string" ? { date: entry, name: undefined } : entry;
      await tx.query(`insert into holidays (clinic_id, date, name) values ($1, $2, $3) on conflict do nothing`, [
        clinicId,
        holiday.date,
        holiday.name ?? null,
      ]);
    }
    await replaceBlocks(tx, clinicId, config);

    return { clinicId, channelId };
  });
}

/** Profissionais são atualizados pela key; os que saíram do arquivo ficam inativos. */
async function replaceProfessionals(tx: Queryable, clinicId: string, config: ClinicConfig): Promise<void> {
  for (const [index, professional] of config.professionals.entries()) {
    const { rows } = await tx.query<{ id: string }>(
      `insert into professionals (clinic_id, key, name, google_calendar_id, sort_order, active)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (clinic_id, key) do update set
         name = excluded.name, google_calendar_id = excluded.google_calendar_id,
         sort_order = excluded.sort_order, active = excluded.active, updated_at = now()
       returning id`,
      [clinicId, professional.key, professional.name, professional.google_calendar_id ?? null, index, professional.active],
    );
    const professionalId = rows[0]!.id;

    await tx.query(`delete from professional_services where professional_id = $1`, [professionalId]);
    if (professional.services) {
      await tx.query(
        `insert into professional_services (professional_id, service_id)
         select $1, id from services where clinic_id = $2 and key = any($3::text[])`,
        [professionalId, clinicId, professional.services],
      );
    }

    await tx.query(`delete from professional_hours where professional_id = $1`, [professionalId]);
    for (const [day, ranges] of Object.entries(professional.hours ?? {})) {
      for (const range of ranges ?? []) {
        const [starts, ends] = range.split("-");
        await tx.query(`insert into professional_hours (professional_id, weekday, starts_at, ends_at) values ($1, $2, $3, $4)`, [
          professionalId,
          WEEKDAYS.indexOf(day as WeekdayKey),
          starts,
          ends,
        ]);
      }
    }
  }
  await tx.query(
    `update professionals set active = false, updated_at = now() where clinic_id = $1 and not (key = any($2::text[]))`,
    [clinicId, config.professionals.map((p) => p.key)],
  );
}

async function replaceBlocks(tx: Queryable, clinicId: string, config: ClinicConfig): Promise<void> {
  await tx.query(`delete from schedule_blocks where clinic_id = $1`, [clinicId]);
  for (const block of config.blocks) {
    const [startDate, startTime] = block.start.split("T") as [string, string];
    const [endDate, endTime] = block.end.split("T") as [string, string];
    await tx.query(
      `insert into schedule_blocks (clinic_id, professional_id, starts_at, ends_at, reason)
       values ($1, (select id from professionals where clinic_id = $1 and key = $2), $3, $4, $5)`,
      [
        clinicId,
        block.professional ?? null,
        fromLocal(startDate, startTime, config.timezone),
        fromLocal(endDate, endTime, config.timezone),
        block.reason ?? null,
      ],
    );
  }
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
