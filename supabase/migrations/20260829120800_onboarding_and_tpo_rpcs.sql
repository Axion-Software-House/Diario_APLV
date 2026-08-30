-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — F0: onboarding só cria a criança; TPO é iniciado à parte
--
-- Antes: create_onboarding criava criança + protocolo + etapa 1 numa
-- transação — o app assumia que todo mundo estava num TPO.
--
-- Agora:
--   • create_onboarding  → cria SÓ a criança (nome, nascimento, feeding,
--                          motivo, profissional). Retorna o child_id.
--   • start_tpo           → cria o protocolo (status active, etapa 1) e a
--                          primeira linha de stage_history. Chamado quando
--                          a família inicia uma reintrodução orientada.
--   • create_symptom_event → passa a receber p_child_id (obrigatório) e
--                          p_protocol_id (opcional). O stage sai do
--                          protocolo só quando ele existe.
--
-- security invoker (padrão): a RLS continua valendo para cada insert.
-- ═══════════════════════════════════════════════════════════════

-- ── create_onboarding: só a criança ───────────────────────────
create or replace function public.create_onboarding(
  p_child_name    text,
  p_birth_date    date        default null,
  p_feeding       text        default null,
  p_reason        text        default null,
  p_professional  text        default null,
  -- aceito por compatibilidade com o client atual; ignorado.
  p_started_at    timestamptz default now()
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_child uuid;
begin
  if v_user is null then
    raise exception 'Sessão não autenticada.' using errcode = '42501';
  end if;

  insert into public.children (user_id, name, birth_date, feeding, reason, professional)
  values (
    v_user,
    p_child_name,
    p_birth_date,
    nullif(btrim(p_feeding), ''),
    nullif(btrim(p_reason), ''),
    nullif(btrim(p_professional), '')
  )
  returning id into v_child;

  return v_child;
end $$;

-- ── start_tpo: inicia uma reintrodução guiada ─────────────────
create function public.start_tpo(
  p_child_id    uuid,
  p_started_at  timestamptz default now(),
  p_note        text        default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_start    timestamptz := coalesce(p_started_at, now());
  v_protocol uuid;
begin
  if v_user is null then
    raise exception 'Sessão não autenticada.' using errcode = '42501';
  end if;

  -- Um TPO ativo por vez. O select confirma a posse da criança.
  if exists (
    select 1 from public.protocols
    where child_id = p_child_id and user_id = v_user and status = 'active'
  ) then
    raise exception 'Já existe um TPO em andamento.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.children
    where id = p_child_id and user_id = v_user
  ) then
    raise exception 'Criança não encontrada.' using errcode = '42501';
  end if;

  insert into public.protocols (user_id, child_id, started_at, status, current_stage)
  values (v_user, p_child_id, v_start, 'active', 1)
  returning id into v_protocol;

  insert into public.stage_history (user_id, protocol_id, stage, started_at, note)
  values (v_user, v_protocol, 1, v_start, nullif(btrim(p_note), ''));

  return v_protocol;
end $$;

-- ── create_symptom_event: criança obrigatória, protocolo opcional ──
-- A assinatura muda (novo p_child_id, p_protocol_id vira opcional no fim),
-- então precisa de DROP antes do CREATE.
drop function if exists public.create_symptom_event(uuid, timestamptz, jsonb, uuid, boolean, text);

create function public.create_symptom_event(
  p_child_id     uuid,
  p_occurred_at  timestamptz default now(),
  p_items        jsonb       default '[]'::jsonb,
  p_exposure_id  uuid        default null,
  p_no_symptoms  boolean     default false,
  p_note         text        default null,
  p_protocol_id  uuid        default null
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

  -- Só lê o stage se o evento estiver amarrado a um TPO do próprio usuário.
  if p_protocol_id is not null then
    select current_stage into v_stage
    from public.protocols
    where id = p_protocol_id and user_id = v_user;

    if v_stage is null then
      raise exception 'Acompanhamento não encontrado.' using errcode = '42501';
    end if;
  end if;

  insert into public.symptom_events (
    user_id, child_id, protocol_id, exposure_id, stage, occurred_at, no_symptoms, note
  )
  values (
    v_user,
    p_child_id,
    p_protocol_id,
    p_exposure_id,
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
