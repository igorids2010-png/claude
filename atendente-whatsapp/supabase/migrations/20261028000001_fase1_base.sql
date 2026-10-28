-- Fase 1: clínicas, canais de WhatsApp, pacientes, conversas, mensagens e fila de jobs.
--
-- O servidor acessa o banco por conexão Postgres direta (DATABASE_URL). Todas as tabelas
-- têm RLS ligado e nenhuma política pública: a chave publishable do Supabase não lê nada.
-- O painel da Fase 6 vai ganhar políticas próprias, por clínica.

create table clinics (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  timezone    text not null default 'America/Sao_Paulo',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Um número de WhatsApp (phone_number_id da Meta) pertence a uma clínica.
-- O token de acesso fica criptografado (AES-256-GCM) com a ENCRYPTION_KEY do servidor.
create table clinic_channels (
  id                       uuid primary key default gen_random_uuid(),
  clinic_id                uuid not null references clinics (id) on delete cascade,
  phone_number_id          text not null unique,
  waba_id                  text,
  display_phone            text,
  access_token_ciphertext  text not null,
  active                   boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index clinic_channels_clinic_id_idx on clinic_channels (clinic_id);

-- LGPD: guardamos só o identificador do WhatsApp. Nome e demais dados só quando o
-- paciente informar para agendar (Fase 3).
create table patients (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics (id) on delete cascade,
  wa_id       text not null,
  name        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (clinic_id, wa_id)
);

-- No WhatsApp cada paciente tem uma única conversa contínua com cada número.
create table conversations (
  id                  uuid primary key default gen_random_uuid(),
  clinic_id           uuid not null references clinics (id) on delete cascade,
  channel_id          uuid not null references clinic_channels (id) on delete cascade,
  patient_id          uuid not null references patients (id) on delete cascade,
  status              text not null default 'bot' check (status in ('bot', 'human')),
  last_inbound_at     timestamptz,
  disclosure_sent_at  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (channel_id, patient_id)
);
create index conversations_clinic_id_idx on conversations (clinic_id);

create table messages (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics (id) on delete cascade,
  conversation_id  uuid not null references conversations (id) on delete cascade,
  direction        text not null check (direction in ('inbound', 'outbound')),
  -- ID da Meta (wamid...). Único: é o que garante a idempotência do webhook.
  wa_message_id    text unique,
  -- Só para mensagens enviadas: identifica a "vaga" da resposta dentro de um
  -- processamento, para uma nova tentativa do job não reenviar o que já saiu.
  dedupe_key       text unique,
  type             text not null,
  body             text,
  status           text not null,
  wa_timestamp     timestamptz,
  handled_at       timestamptz,
  error            jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index messages_conversation_created_idx on messages (conversation_id, created_at);
create index messages_unhandled_idx on messages (conversation_id)
  where direction = 'inbound' and handled_at is null;

-- Fila durável. Os workers pegam jobs com FOR UPDATE SKIP LOCKED.
create table jobs (
  id               uuid primary key default gen_random_uuid(),
  type             text not null,
  conversation_id  uuid references conversations (id) on delete cascade,
  payload          jsonb not null default '{}'::jsonb,
  status           text not null default 'pending'
                   check (status in ('pending', 'running', 'done', 'failed', 'superseded')),
  attempts         integer not null default 0,
  max_attempts     integer not null default 5,
  run_at           timestamptz not null default now(),
  locked_at        timestamptz,
  last_error       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
-- No máximo um job pendente por tipo e conversa: mensagens seguidas do paciente
-- caem no mesmo job (debounce), que responde tudo de uma vez.
create unique index jobs_one_pending_per_conversation_idx
  on jobs (type, conversation_id) where status = 'pending';
create index jobs_ready_idx on jobs (run_at) where status = 'pending';
create index jobs_running_idx on jobs (conversation_id) where status = 'running';

alter table clinics          enable row level security;
alter table clinic_channels  enable row level security;
alter table patients         enable row level security;
alter table conversations    enable row level security;
alter table messages         enable row level security;
alter table jobs             enable row level security;
