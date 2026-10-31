-- Fase 4: transferência para atendimento humano e ponte de mensagens com a recepção.

-- Código curto da conversa (ex.: A3F9C), usado pela recepção nos comandos pelo WhatsApp.
alter table conversations
  add column short_code text not null default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5)),
  -- Tentativas seguidas em que o atendente não resolveu; com 2, a conversa vai para a equipe.
  add column unresolved_count integer not null default 0;
create unique index conversations_short_code_idx on conversations (clinic_id, short_code);

-- Outros números da equipe autorizados a usar os comandos (além do team_alert_wa_id).
alter table clinics add column staff_wa_ids text[] not null default '{}';

alter table messages
  -- Quem escreveu uma mensagem enviada: o atendente automático, a equipe (pela ponte) ou o sistema.
  add column author text check (author in ('bot', 'staff', 'system')),
  -- Mensagem do paciente encaminhada à recepção durante o atendimento humano.
  add column forwarded_at timestamptz;

create table handoffs (
  id                     uuid primary key default gen_random_uuid(),
  clinic_id              uuid not null references clinics (id) on delete cascade,
  conversation_id        uuid not null references conversations (id) on delete cascade,
  reason                 text not null check (reason in (
                           'patient_request', 'frustrated', 'out_of_scope', 'unresolved', 'emergency', 'staff', 'other')),
  summary                text,
  started_by             text not null check (started_by in ('patient', 'ai', 'system', 'staff')),
  started_at             timestamptz not null default now(),
  last_staff_message_at  timestamptz,
  ended_at               timestamptz,
  ended_by               text check (ended_by in ('staff', 'timeout', 'cli'))
);
-- No máximo um atendimento humano aberto por conversa.
create unique index handoffs_one_open_idx on handoffs (conversation_id) where ended_at is null;

-- Mensagens que a equipe manda para o número da clínica (comandos e respostas aos pacientes).
create table staff_inbound (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null references clinics (id) on delete cascade,
  channel_id     uuid not null references clinic_channels (id) on delete cascade,
  from_wa_id     text not null,
  wa_message_id  text not null unique,
  type           text not null,
  body           text,
  handled_at     timestamptz,
  created_at     timestamptz not null default now()
);

alter table handoffs       enable row level security;
alter table staff_inbound  enable row level security;
