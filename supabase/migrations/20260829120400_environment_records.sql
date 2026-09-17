-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — F0: Ambiente / Visita  (README FINAL §11)
--
-- Registra mudanças de ambiente ou situações que possam ser relevantes
-- na leitura posterior da timeline (casa de familiares, creche, festa,
-- viagem, contato com produtos diferentes...).
--
-- `place` é texto (catálogo em src/constants/environments.ts). `different`
-- é o campo livre opcional "teve algo diferente do habitual?".
-- ═══════════════════════════════════════════════════════════════

create table public.environment_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  child_id     uuid not null references public.children (id) on delete cascade,
  protocol_id  uuid references public.protocols (id) on delete set null,
  stage        smallint check (stage between 1 and 5),
  occurred_at  timestamptz not null,
  place        text not null check (char_length(place) between 1 and 80),
  different    text check (different is null or char_length(different) between 1 and 2000),
  note         text check (note is null or char_length(note) between 1 and 2000),
  created_at   timestamptz not null default now()
);
create index environment_records_child_idx on public.environment_records (child_id, occurred_at desc);

-- ── RLS ────────────────────────────────────────────────────────
alter table public.environment_records enable row level security;

create policy environment_records_select on public.environment_records
  for select using (user_id = auth.uid());
create policy environment_records_insert on public.environment_records
  for insert with check (
    user_id = auth.uid()
    and public.owns_child(child_id)
    and (protocol_id is null or public.owns_protocol(protocol_id))
  );
create policy environment_records_update on public.environment_records
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.owns_child(child_id)
    and (protocol_id is null or public.owns_protocol(protocol_id))
  );
create policy environment_records_delete on public.environment_records
  for delete using (user_id = auth.uid());
