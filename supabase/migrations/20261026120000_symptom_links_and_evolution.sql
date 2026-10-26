-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — Vínculo de sintoma com ambiente/produto e evolução
--
-- 1. Em symptom_events: adiciona environment_id e product_id opcionais
--    (além de exposure_id já existente).
-- 2. Helpers de posse owns_environment_record e owns_product_record +
--    atualização das policies de insert/update de symptom_events.
-- 3. Tabela symptom_evolutions ligada ao symptom_event original para
--    registrar a evolução do episódio (piorou / melhorou / ficou igual)
--    ao longo dos dias seguintes, formando a linha do tempo do episódio.
-- 4. RPC create_symptom_event atualizada para aceitar p_environment_id
--    e p_product_id opcionais.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Colunas de vínculo em symptom_events ────────────────────
alter table public.symptom_events
  add column environment_id uuid references public.environment_records(id) on delete set null,
  add column product_id     uuid references public.product_records(id)     on delete set null;

create index symptom_events_environment_idx on public.symptom_events (environment_id);
create index symptom_events_product_idx     on public.symptom_events (product_id);

-- ── 2. Helpers de posse e policies de symptom_events ───────────
create function public.owns_environment_record(p_environment_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select p_environment_id is null or exists (
    select 1 from public.environment_records er
    where er.id = p_environment_id and er.user_id = auth.uid()
  )
$$;

create function public.owns_product_record(p_product_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select p_product_id is null or exists (
    select 1 from public.product_records pr
    where pr.id = p_product_id and pr.user_id = auth.uid()
  )
$$;

drop policy symptom_events_insert on public.symptom_events;
drop policy symptom_events_update on public.symptom_events;

create policy symptom_events_insert on public.symptom_events
  for insert with check (
    user_id = auth.uid()
    and public.owns_child(child_id)
    and (protocol_id is null or public.owns_protocol(protocol_id))
    and public.owns_exposure(exposure_id)
    and public.owns_environment_record(environment_id)
    and public.owns_product_record(product_id)
  );

create policy symptom_events_update on public.symptom_events
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.owns_child(child_id)
    and (protocol_id is null or public.owns_protocol(protocol_id))
    and public.owns_exposure(exposure_id)
    and public.owns_environment_record(environment_id)
    and public.owns_product_record(product_id)
  );

-- ── 3. Evolução do episódio de sintoma ─────────────────────────
create type public.symptom_evolution_status as enum (
  'worsened',
  'improved',
  'unchanged'
);

create table public.symptom_evolutions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  child_id          uuid not null references public.children(id) on delete cascade,
  symptom_event_id  uuid not null references public.symptom_events(id) on delete cascade,
  occurred_at       timestamptz not null default now(),
  status            public.symptom_evolution_status not null,
  note              text check (char_length(note) <= 2000),
  created_at        timestamptz not null default now()
);

create index symptom_evolutions_event_occurred_idx
  on public.symptom_evolutions (symptom_event_id, occurred_at asc);

create index symptom_evolutions_child_occurred_idx
  on public.symptom_evolutions (child_id, occurred_at desc);

alter table public.symptom_evolutions enable row level security;

create policy symptom_evolutions_select on public.symptom_evolutions
  for select using (user_id = auth.uid());

create policy symptom_evolutions_insert on public.symptom_evolutions
  for insert with check (
    user_id = auth.uid()
    and public.owns_child(child_id)
    and public.owns_symptom_event(symptom_event_id)
  );

create policy symptom_evolutions_update on public.symptom_evolutions
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.owns_child(child_id)
    and public.owns_symptom_event(symptom_event_id)
  );

create policy symptom_evolutions_delete on public.symptom_evolutions
  for delete using (user_id = auth.uid());

-- ── 4. RPC create_symptom_event com vínculos opcionais ─────────
drop function if exists public.create_symptom_event(uuid, timestamptz, jsonb, uuid, boolean, text, uuid);

create function public.create_symptom_event(
  p_child_id        uuid,
  p_occurred_at     timestamptz default now(),
  p_items           jsonb       default '[]'::jsonb,
  p_exposure_id     uuid        default null,
  p_no_symptoms     boolean     default false,
  p_note            text        default null,
  p_protocol_id     uuid        default null,
  p_environment_id  uuid        default null,
  p_product_id      uuid        default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_items jsonb := coalesce(p_items, '[]'::jsonb);
  v_event uuid;
  v_stage smallint;
begin
  if v_user is null then
    raise exception 'Sessão não autenticada.' using errcode = '42501';
  end if;

  if p_no_symptoms and jsonb_array_length(v_items) > 0 then
    raise exception 'Registro sem sintomas não aceita sintomas marcados.'
      using errcode = '22023';
  end if;

  if not p_no_symptoms and jsonb_array_length(v_items) = 0 then
    raise exception 'Marque ao menos um sintoma.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.children where id = p_child_id and user_id = v_user
  ) then
    raise exception 'Criança não encontrada.' using errcode = '42501';
  end if;

  if p_protocol_id is not null then
    select current_stage into v_stage
    from public.protocols
    where id = p_protocol_id and user_id = v_user;

    if v_stage is null then
      raise exception 'Acompanhamento não encontrado.' using errcode = '42501';
    end if;
  end if;

  insert into public.symptom_events (
    user_id,
    child_id,
    protocol_id,
    exposure_id,
    environment_id,
    product_id,
    stage,
    occurred_at,
    no_symptoms,
    note
  )
  values (
    v_user,
    p_child_id,
    p_protocol_id,
    p_exposure_id,
    p_environment_id,
    p_product_id,
    v_stage,
    coalesce(p_occurred_at, now()),
    p_no_symptoms,
    nullif(btrim(p_note), '')
  )
  returning id into v_event;

  insert into public.symptom_event_items (user_id, symptom_event_id, code, intensity)
  select
    v_user,
    v_event,
    item ->> 'code',
    (item ->> 'intensity')::smallint
  from jsonb_array_elements(v_items) as item;

  return v_event;
end $$;
