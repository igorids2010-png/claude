import type { Queryable } from "../db/db.js";

export type Specialty = "fisioterapia" | "odontologia" | "estetica" | "veterinaria" | "outra";

export interface ServiceInfo {
  key: string;
  name: string;
  description: string | null;
  priceCents: number | null;
  priceNote: string | null;
  durationMinutes: number;
}

export interface ProfessionalInfo {
  key: string;
  name: string;
  /** Keys dos serviços que atende; null = todos. */
  serviceKeys: string[] | null;
}

export interface BusinessHoursRange {
  /** 0 = domingo ... 6 = sábado */
  weekday: number;
  opensAt: string; // HH:MM
  closesAt: string; // HH:MM
}

/** Tudo o que o atendente sabe sobre a clínica. */
export interface ClinicProfile {
  id: string;
  name: string;
  specialty: Specialty;
  timezone: string;
  address: string | null;
  mapsUrl: string | null;
  phone: string | null;
  cancellationPolicy: string | null;
  paymentMethods: string | null;
  insuranceNotes: string | null;
  extraInfo: string | null;
  services: ServiceInfo[];
  businessHours: BusinessHoursRange[];
  insurancePlans: string[];
  professionals: ProfessionalInfo[];
  /** Há profissionais e serviços: o atendente consulta e marca horários. */
  schedulingEnabled: boolean;
}

export async function loadClinicProfile(db: Queryable, clinicId: string): Promise<ClinicProfile | null> {
  const clinic = await db.query<{
    id: string;
    name: string;
    specialty: Specialty;
    timezone: string;
    address: string | null;
    maps_url: string | null;
    phone_display: string | null;
    cancellation_policy: string | null;
    payment_methods: string | null;
    insurance_notes: string | null;
    extra_info: string | null;
  }>(
    `select id, name, specialty, timezone, address, maps_url, phone_display, cancellation_policy,
            payment_methods, insurance_notes, extra_info
     from clinics where id = $1`,
    [clinicId],
  );
  const row = clinic.rows[0];
  if (!row) return null;

  const [services, hours, plans, professionals] = await Promise.all([
    db.query<{
      key: string;
      name: string;
      description: string | null;
      price_cents: number | null;
      price_note: string | null;
      duration_minutes: number;
    }>(
      `select key, name, description, price_cents, price_note, duration_minutes
       from services where clinic_id = $1 and active order by sort_order, name`,
      [clinicId],
    ),
    db.query<{ weekday: number; opens_at: string; closes_at: string }>(
      `select weekday, to_char(opens_at, 'HH24:MI') as opens_at, to_char(closes_at, 'HH24:MI') as closes_at
       from business_hours where clinic_id = $1 order by weekday, opens_at`,
      [clinicId],
    ),
    db.query<{ name: string }>(`select name from insurance_plans where clinic_id = $1 order by name`, [clinicId]),
    db.query<{ key: string; name: string; service_keys: string[] | null }>(
      `select p.key, p.name,
              (select array_agg(s.key order by s.sort_order) from professional_services ps
                 join services s on s.id = ps.service_id
                where ps.professional_id = p.id and s.active) as service_keys
       from professionals p where p.clinic_id = $1 and p.active order by p.sort_order, p.name`,
      [clinicId],
    ),
  ]);

  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    timezone: row.timezone,
    address: row.address,
    mapsUrl: row.maps_url,
    phone: row.phone_display,
    cancellationPolicy: row.cancellation_policy,
    paymentMethods: row.payment_methods,
    insuranceNotes: row.insurance_notes,
    extraInfo: row.extra_info,
    services: services.rows.map((s) => ({
      key: s.key,
      name: s.name,
      description: s.description,
      priceCents: s.price_cents,
      priceNote: s.price_note,
      durationMinutes: s.duration_minutes,
    })),
    businessHours: hours.rows.map((h) => ({ weekday: Number(h.weekday), opensAt: h.opens_at, closesAt: h.closes_at })),
    insurancePlans: plans.rows.map((p) => p.name),
    professionals: professionals.rows.map((p) => ({ key: p.key, name: p.name, serviceKeys: p.service_keys })),
    schedulingEnabled: professionals.rows.length > 0 && services.rows.length > 0,
  };
}

/** Cache curto: a configuração muda raramente e é lida a cada mensagem. */
export function createProfileCache(db: Queryable, ttlMs = 60_000) {
  const cache = new Map<string, { profile: ClinicProfile; expiresAt: number }>();
  return async (clinicId: string): Promise<ClinicProfile | null> => {
    const hit = cache.get(clinicId);
    if (hit && hit.expiresAt > Date.now()) return hit.profile;
    const profile = await loadClinicProfile(db, clinicId);
    if (profile) cache.set(clinicId, { profile, expiresAt: Date.now() + ttlMs });
    return profile;
  };
}
