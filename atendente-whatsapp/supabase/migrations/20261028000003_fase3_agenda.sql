-- Fase 3: profissionais, regras de agenda, agendamentos e confirmação em duas etapas.

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

alter table clinics
  add column slot_step_minutes    integer not null default 30 check (slot_step_minutes between 5 and 240),
  -- Antecedência mínima para marcar (ex.: não marcar para daqui a 30 min).
  add column min_advance_minutes  integer not null default 120 check (min_advance_minutes between 0 and 10080),
  -- Até quantos dias à frente o atendente oferece horários.
  add column max_advance_days     integer not null default 60 check (max_advance_days between 1 and 365),
  -- Inclui automaticamente os feriados nacionais.
  add column national_holidays    boolean not null default true;

create table professionals (
  id                  uuid primary key default gen_random_uuid(),
  clinic_id           uuid not null references clinics (id) on delete cascade,
  key                 text not null check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name                text not null,
  -- Agenda do Google compartilhada com a conta de serviço (opcional).
  google_calendar_id  text,
  sort_order          integer not null default 0,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (clinic_id, key)
);

-- Sem linhas para um profissional = ele atende todos os serviços.
create table professional_services (
  professional_id  uuid not null references professionals (id) on delete cascade,
  service_id       uuid not null references services (id) on delete cascade,
  primary key (professional_id, service_id)
);

-- Sem linhas para um profissional = segue o horário da clínica.
create table professional_hours (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid not null references professionals (id) on delete cascade,
  weekday          smallint not null check (weekday between 0 and 6),
  starts_at        time not null,
  ends_at          time not null,
  check (starts_at < ends_at)
);
create index professional_hours_idx on professional_hours (professional_id, weekday);

create table holidays (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  date       date not null,
  name       text,
  unique (clinic_id, date)
);

-- Bloqueios de agenda (férias, reforma, congresso). professional_id nulo = clínica toda.
create table schedule_blocks (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics (id) on delete cascade,
  professional_id  uuid references professionals (id) on delete cascade,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  reason           text,
  check (starts_at < ends_at)
);
create index schedule_blocks_clinic_idx on schedule_blocks (clinic_id, starts_at);

create table appointments (
  id                   uuid primary key default gen_random_uuid(),
  clinic_id            uuid not null references clinics (id) on delete cascade,
  professional_id      uuid not null references professionals (id),
  service_id           uuid not null references services (id),
  patient_id           uuid references patients (id) on delete set null,
  conversation_id      uuid references conversations (id) on delete set null,
  patient_name         text not null,
  starts_at            timestamptz not null,
  ends_at              timestamptz not null,
  -- Fim do atendimento + intervalo de preparo: é o que ocupa a agenda.
  blocked_until        timestamptz not null,
  -- held: reservado enquanto o paciente confirma; expira sozinho.
  status               text not null check (status in ('held', 'scheduled', 'cancelled', 'expired', 'completed', 'no_show')),
  hold_expires_at      timestamptz,
  rescheduled_from     uuid references appointments (id),
  cancel_reason        text,
  google_event_id      text,
  google_sync_status   text not null default 'pending'
                       check (google_sync_status in ('pending', 'synced', 'failed', 'not_configured')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  cancelled_at         timestamptz,
  check (starts_at < ends_at and ends_at <= blocked_until),
  -- A garantia contra conflito: o banco recusa dois horários sobrepostos do mesmo profissional,
  -- mesmo que dois pacientes tentem marcar no mesmo instante.
  constraint appointments_no_overlap exclude using gist (
    professional_id with =,
    tstzrange(starts_at, blocked_until, '[)') with &&
  ) where (status in ('held', 'scheduled'))
);
create index appointments_clinic_starts_idx on appointments (clinic_id, starts_at);
create index appointments_patient_idx on appointments (patient_id, starts_at);

-- Ação de agenda proposta ao paciente e aguardando o "sim" dele. Só pode ser confirmada
-- a partir de uma mensagem do paciente posterior à proposta.
create table pending_actions (
  id                 uuid primary key default gen_random_uuid(),
  clinic_id          uuid not null references clinics (id) on delete cascade,
  conversation_id    uuid not null references conversations (id) on delete cascade,
  kind               text not null check (kind in ('book', 'reschedule', 'cancel')),
  -- Agendamento reservado (book), a remarcar ou a cancelar.
  appointment_id     uuid not null references appointments (id) on delete cascade,
  payload            jsonb not null default '{}'::jsonb,
  -- Mensagem do paciente que estava sendo respondida quando a proposta foi feita.
  proposed_at_message_id  uuid not null,
  status             text not null default 'pending' check (status in ('pending', 'confirmed', 'superseded', 'expired')),
  expires_at         timestamptz not null,
  created_at         timestamptz not null default now()
);
create index pending_actions_conversation_idx on pending_actions (conversation_id) where status = 'pending';

alter table professionals          enable row level security;
alter table professional_services  enable row level security;
alter table professional_hours     enable row level security;
alter table holidays               enable row level security;
alter table schedule_blocks        enable row level security;
alter table appointments           enable row level security;
alter table pending_actions        enable row level security;
