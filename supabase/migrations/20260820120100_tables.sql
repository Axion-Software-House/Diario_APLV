-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — tabelas
--
-- Toda tabela filha carrega `user_id` denormalizado: RLS vira
-- `user_id = auth.uid()`, sem JOIN recursivo em cada policy.
-- Todo evento do diário tem `occurred_at` (preenchido automaticamente
-- pela UI com a hora atual e editável pela usuária).
-- Não existe tabela nem view `timeline`: a timeline é unida no frontend.
-- ═══════════════════════════════════════════════════════════════

-- ── profiles ───────────────────────────────────────────────────
-- Espelha auth.users. Criada automaticamente pelo trigger handle_new_user.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now()
);

-- ── children ───────────────────────────────────────────────────
-- `feeding` guarda o código da alimentação atual (catálogo em
-- src/constants/feeding.ts). Texto, e não enum, para o catálogo
-- evoluir sem migration.
create table public.children (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  birth_date  date,
  feeding     text,
  created_at  timestamptz not null default now()
);
create index children_user_id_idx on public.children (user_id);

-- ── protocols ──────────────────────────────────────────────────
-- O "acompanhamento". 5 etapas da escada do leite (constants/stages.ts).
create table public.protocols (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  child_id       uuid not null references public.children (id) on delete cascade,
  title          text,
  reason         text,
  professional   text,
  current_stage  smallint not null default 1 check (current_stage between 1 and 5),
  status         public.protocol_status not null default 'active',
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  created_at     timestamptz not null default now()
);
create index protocols_user_child_idx on public.protocols (user_id, child_id);

-- ── stage_history ──────────────────────────────────────────────
-- Histórico IMUTÁVEL. Avançar/repetir/retornar sempre fecha o período
-- corrente (ended_at + outcome) e cria uma linha nova. Nunca faz update
-- destrutivo do que já foi vivido.
create table public.stage_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  protocol_id  uuid not null references public.protocols (id) on delete cascade,
  stage        smallint not null check (stage between 1 and 5),
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  outcome      public.stage_outcome,
  note         text,
  created_at   timestamptz not null default now()
);
create index stage_history_protocol_idx on public.stage_history (protocol_id, started_at desc);

-- ── exposures ──────────────────────────────────────────────────
-- O que foi consumido. `food` é o único campo de digitação livre
-- obrigatório do fluxo rápido; `amount` é seleção por toque.
create table public.exposures (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  protocol_id  uuid not null references public.protocols (id) on delete cascade,
  stage        smallint not null check (stage between 1 and 5),
  occurred_at  timestamptz not null,
  food         text not null check (char_length(food) between 1 and 200),
  amount       public.exposure_amount,
  note         text,
  created_at   timestamptz not null default now()
);
create index exposures_protocol_idx on public.exposures (protocol_id, occurred_at desc);

-- ── symptom_events ─────────────────────────────────────────────
-- `no_symptoms = true` é o registro "SEM SINTOMAS" (botão separado na Home)
-- e não tem nenhum item associado.
-- `exposure_id` é o vínculo OPCIONAL com uma exposição; a temporalidade
-- (symptom.occurred_at - exposure.occurred_at) é calculada no frontend
-- e exibida como intervalo. Nunca como causalidade.
create table public.symptom_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  protocol_id  uuid not null references public.protocols (id) on delete cascade,
  exposure_id  uuid references public.exposures (id) on delete set null,
  stage        smallint not null check (stage between 1 and 5),
  occurred_at  timestamptz not null,
  no_symptoms  boolean not null default false,
  note         text,
  created_at   timestamptz not null default now()
);
create index symptom_events_protocol_idx on public.symptom_events (protocol_id, occurred_at desc);
create index symptom_events_exposure_idx on public.symptom_events (exposure_id);

-- ── symptom_event_items ────────────────────────────────────────
-- Um item por sintoma marcado. `code` vem de src/constants/symptoms.ts.
-- `intensity`: 1 = Leve, 2 = Moderada, 3 = Intensa. Obrigatória porque,
-- na UI, é o toque na intensidade que seleciona o sintoma.
create table public.symptom_event_items (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  symptom_event_id  uuid not null references public.symptom_events (id) on delete cascade,
  code              text not null,
  intensity         smallint not null check (intensity between 1 and 3),
  created_at        timestamptz not null default now(),
  unique (symptom_event_id, code)
);
create index symptom_event_items_event_idx on public.symptom_event_items (symptom_event_id);

-- ── diaper_records ─────────────────────────────────────────────
-- Três seletores por toque. Foto está fora do MVP.
create table public.diaper_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  protocol_id  uuid not null references public.protocols (id) on delete cascade,
  stage        smallint not null check (stage between 1 and 5),
  occurred_at  timestamptz not null,
  blood        public.diaper_blood not null default 'nao',
  mucus        public.diaper_mucus not null default 'nao',
  consistency  public.diaper_consistency,
  note         text,
  created_at   timestamptz not null default now()
);
create index diaper_records_protocol_idx on public.diaper_records (protocol_id, occurred_at desc);

-- ── notes ──────────────────────────────────────────────────────
create table public.notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  protocol_id  uuid not null references public.protocols (id) on delete cascade,
  stage        smallint not null check (stage between 1 and 5),
  occurred_at  timestamptz not null,
  content      text not null check (char_length(content) between 1 and 2000),
  created_at   timestamptz not null default now()
);
create index notes_protocol_idx on public.notes (protocol_id, occurred_at desc);
