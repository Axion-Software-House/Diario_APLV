-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — Row Level Security
--
-- RLS é a única barreira entre os dados de saúde de duas famílias.
-- NUNCA desativar para ganhar velocidade de desenvolvimento.
--
-- Duas checagens, não uma:
--   1. user_id = auth.uid()        -> a linha é minha
--   2. o PAI da linha também é meu -> não posso escrever dentro
--                                     do acompanhamento de outra família
--
-- Só (1) não basta: com a FK aberta, um usuário mal-intencionado
-- que descubra um protocol_id alheio consegue injetar registros
-- nele usando o próprio user_id. As funções owns_* abaixo fecham isso.
-- ═══════════════════════════════════════════════════════════════

-- ── helpers de posse ───────────────────────────────────────────
-- SQL stable, invoker: a RLS da tabela consultada também se aplica,
-- e a comparação explícita com auth.uid() mantém a resposta correta
-- independentemente disso.

create function public.owns_child(p_child_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.children c
    where c.id = p_child_id and c.user_id = auth.uid()
  )
$$;

create function public.owns_protocol(p_protocol_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.protocols p
    where p.id = p_protocol_id and p.user_id = auth.uid()
  )
$$;

create function public.owns_exposure(p_exposure_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select p_exposure_id is null or exists (
    select 1 from public.exposures e
    where e.id = p_exposure_id and e.user_id = auth.uid()
  )
$$;

create function public.owns_symptom_event(p_event_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.symptom_events s
    where s.id = p_event_id and s.user_id = auth.uid()
  )
$$;

-- ── profiles (chaveia por id) ──────────────────────────────────
alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select using (id = auth.uid());
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_delete on public.profiles
  for delete using (id = auth.uid());

-- ── children (raiz: só posse direta) ───────────────────────────
alter table public.children enable row level security;

create policy children_select on public.children
  for select using (user_id = auth.uid());
create policy children_insert on public.children
  for insert with check (user_id = auth.uid());
create policy children_update on public.children
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy children_delete on public.children
  for delete using (user_id = auth.uid());

-- ── protocols (pai: children) ──────────────────────────────────
alter table public.protocols enable row level security;

create policy protocols_select on public.protocols
  for select using (user_id = auth.uid());
create policy protocols_insert on public.protocols
  for insert with check (user_id = auth.uid() and public.owns_child(child_id));
create policy protocols_update on public.protocols
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.owns_child(child_id));
create policy protocols_delete on public.protocols
  for delete using (user_id = auth.uid());

-- ── tabelas de evento (pai: protocols) ─────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'stage_history',
    'exposures',
    'diaper_records',
    'notes'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy %I on public.%I for select using (user_id = auth.uid())',
      t || '_select', t);
    execute format(
      'create policy %I on public.%I for insert
         with check (user_id = auth.uid() and public.owns_protocol(protocol_id))',
      t || '_insert', t);
    execute format(
      'create policy %I on public.%I for update using (user_id = auth.uid())
         with check (user_id = auth.uid() and public.owns_protocol(protocol_id))',
      t || '_update', t);
    execute format(
      'create policy %I on public.%I for delete using (user_id = auth.uid())',
      t || '_delete', t);
  end loop;
end $$;

-- ── symptom_events (pais: protocols + exposures) ───────────────
alter table public.symptom_events enable row level security;

create policy symptom_events_select on public.symptom_events
  for select using (user_id = auth.uid());
create policy symptom_events_insert on public.symptom_events
  for insert with check (
    user_id = auth.uid()
    and public.owns_protocol(protocol_id)
    and public.owns_exposure(exposure_id)
  );
create policy symptom_events_update on public.symptom_events
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.owns_protocol(protocol_id)
    and public.owns_exposure(exposure_id)
  );
create policy symptom_events_delete on public.symptom_events
  for delete using (user_id = auth.uid());

-- ── symptom_event_items (pai: symptom_events) ──────────────────
alter table public.symptom_event_items enable row level security;

create policy symptom_event_items_select on public.symptom_event_items
  for select using (user_id = auth.uid());
create policy symptom_event_items_insert on public.symptom_event_items
  for insert with check (
    user_id = auth.uid() and public.owns_symptom_event(symptom_event_id)
  );
create policy symptom_event_items_update on public.symptom_event_items
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.owns_symptom_event(symptom_event_id));
create policy symptom_event_items_delete on public.symptom_event_items
  for delete using (user_id = auth.uid());
