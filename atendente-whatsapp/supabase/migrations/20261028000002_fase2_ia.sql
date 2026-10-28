-- Fase 2: configuração da clínica para o atendente, alertas para a equipe, uso de tokens
-- e pedidos de exclusão de dados (LGPD).

alter table clinics
  add column specialty            text not null default 'outra'
    check (specialty in ('fisioterapia', 'odontologia', 'estetica', 'veterinaria', 'outra')),
  add column address              text,
  add column maps_url             text,
  add column phone_display        text,
  add column cancellation_policy  text,
  add column payment_methods      text,
  add column insurance_notes      text,
  add column extra_info           text,
  -- WhatsApp da recepção que recebe os alertas (formato internacional, só dígitos).
  add column team_alert_wa_id     text check (team_alert_wa_id ~ '^\d{10,15}$'),
  -- Template aprovado na Meta, usado quando a janela de 24h da recepção está fechada.
  add column team_alert_template  text;

create table services (
  id                      uuid primary key default gen_random_uuid(),
  clinic_id               uuid not null references clinics (id) on delete cascade,
  key                     text not null check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name                    text not null,
  description             text,
  -- Nulo = preço não divulgado pelo atendente (a equipe informa).
  price_cents             integer check (price_cents >= 0),
  price_note              text,
  duration_minutes        integer not null check (duration_minutes between 5 and 600),
  interval_after_minutes  integer not null default 0 check (interval_after_minutes between 0 and 240),
  sort_order              integer not null default 0,
  active                  boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (clinic_id, key)
);

-- weekday: 0 = domingo ... 6 = sábado. Vários intervalos por dia (ex.: manhã e tarde).
create table business_hours (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6),
  opens_at   time not null,
  closes_at  time not null,
  check (opens_at < closes_at)
);
create index business_hours_clinic_idx on business_hours (clinic_id, weekday);

create table insurance_plans (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  name       text not null,
  notes      text,
  unique (clinic_id, name)
);

create table staff_alerts (
  id                 uuid primary key default gen_random_uuid(),
  clinic_id          uuid not null references clinics (id) on delete cascade,
  conversation_id    uuid not null references conversations (id) on delete cascade,
  kind               text not null check (kind in (
                       'emergency', 'human_requested', 'unanswered_question', 'scheduling_request',
                       'complaint', 'data_deletion', 'ai_failure', 'other')),
  summary            text not null,
  -- Mensagem do paciente que originou o alerta: evita alerta repetido numa nova tentativa.
  source_message_id  uuid references messages (id) on delete set null,
  delivery_status    text not null default 'pending'
                     check (delivery_status in ('pending', 'sent', 'failed', 'no_destination')),
  delivery_error     jsonb,
  created_at         timestamptz not null default now(),
  resolved_at        timestamptz,
  unique (conversation_id, kind, source_message_id)
);
create index staff_alerts_clinic_open_idx on staff_alerts (clinic_id, created_at) where resolved_at is null;

-- Uma linha por chamada à API do Claude, para calcular custo por clínica.
create table ai_usage (
  id                           uuid primary key default gen_random_uuid(),
  clinic_id                    uuid not null references clinics (id) on delete cascade,
  conversation_id              uuid references conversations (id) on delete set null,
  model                        text not null,
  input_tokens                 integer not null default 0,
  output_tokens                integer not null default 0,
  cache_read_input_tokens      integer not null default 0,
  cache_creation_input_tokens  integer not null default 0,
  stop_reason                  text,
  created_at                   timestamptz not null default now()
);
create index ai_usage_clinic_created_idx on ai_usage (clinic_id, created_at);
create index ai_usage_conversation_created_idx on ai_usage (conversation_id, created_at);

create view clinic_monthly_ai_usage with (security_invoker = true) as
select
  u.clinic_id,
  c.slug as clinic_slug,
  date_trunc('month', u.created_at at time zone c.timezone)::date as month,
  u.model,
  count(*)                              as calls,
  sum(u.input_tokens)::bigint           as input_tokens,
  sum(u.output_tokens)::bigint          as output_tokens,
  sum(u.cache_read_input_tokens)::bigint     as cache_read_input_tokens,
  sum(u.cache_creation_input_tokens)::bigint as cache_creation_input_tokens
from ai_usage u
join clinics c on c.id = u.clinic_id
group by u.clinic_id, c.slug, 3, u.model;

create table data_deletion_requests (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics (id) on delete cascade,
  patient_id       uuid references patients (id) on delete set null,
  status           text not null default 'pending' check (status in ('pending', 'done', 'rejected')),
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);
create unique index data_deletion_one_pending_idx on data_deletion_requests (patient_id) where status = 'pending';

alter table services                enable row level security;
alter table business_hours          enable row level security;
alter table insurance_plans         enable row level security;
alter table staff_alerts            enable row level security;
alter table ai_usage                enable row level security;
alter table data_deletion_requests  enable row level security;
