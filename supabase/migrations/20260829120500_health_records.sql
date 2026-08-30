-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — F0: Saúde  (README FINAL §12–16)
--
-- Quatro tipos num registro só: medicamento, vacina, consulta, peso.
-- Uma tabela com `data jsonb` em vez de quatro tabelas porque:
--   • os campos de cada tipo são diferentes e poucos;
--   • o app SÓ registra e relê — nunca calcula (sem cálculo de dose, sem
--     curva de crescimento no MVP; §16 diz que curva "não é prioridade").
-- Se a curva de crescimento entrar depois, `weight` ganha tabela própria.
--
-- O app não sugere medicamento nem dose (§13). "Consulta" não é prontuário
-- (§15) — guarda o que a família quer lembrar.
--
-- Formato de `data` por `kind`:
--   medication  { "dose": text }
--   vaccine     { "reaction": text }
--   appointment { "specialty": text, "guidance": text, "questions": text }
--   weight      { "kg": number }
-- `title` guarda o nome do medicamento/vacina ou a especialidade.
-- ═══════════════════════════════════════════════════════════════

create table public.health_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  child_id     uuid not null references public.children (id) on delete cascade,
  protocol_id  uuid references public.protocols (id) on delete set null,
  stage        smallint check (stage between 1 and 5),
  occurred_at  timestamptz not null,
  kind         text not null check (kind in ('medication', 'vaccine', 'appointment', 'weight')),
  title        text check (title is null or char_length(title) between 1 and 120),
  data         jsonb not null default '{}'::jsonb,
  note         text check (note is null or char_length(note) between 1 and 2000),
  created_at   timestamptz not null default now()
);
create index health_records_child_idx on public.health_records (child_id, occurred_at desc);
create index health_records_kind_idx on public.health_records (child_id, kind, occurred_at desc);

-- ── RLS ────────────────────────────────────────────────────────
alter table public.health_records enable row level security;

create policy health_records_select on public.health_records
  for select using (user_id = auth.uid());
create policy health_records_insert on public.health_records
  for insert with check (
    user_id = auth.uid()
    and public.owns_child(child_id)
    and (protocol_id is null or public.owns_protocol(protocol_id))
  );
create policy health_records_update on public.health_records
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.owns_child(child_id)
    and (protocol_id is null or public.owns_protocol(protocol_id))
  );
create policy health_records_delete on public.health_records
  for delete using (user_id = auth.uid());
