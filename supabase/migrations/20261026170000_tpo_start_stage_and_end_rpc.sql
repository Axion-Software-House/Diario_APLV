-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — Etapa inicial no início do TPO e encerramento/pausa
--
-- Achado do QA de 24/10/2026:
--   1. `start_tpo` assumia sempre a Etapa 1. Na prática, a família pode
--      começar o registro já em outra etapa (ex.: Etapa 3 — Queijo) ou em
--      data retroativa, conforme orientação da equipe assistente.
--   2. Não havia RPC para pausar, encerrar ou interromper um TPO ativo,
--      deixando o card "TPO em andamento" na Home indefinidamente.
--
-- Linguagem neutra: 'paused' (pausado), 'finished' (encerrado) e
-- 'interrupted' (interrompido) — nunca termos conclusivos.
-- ═══════════════════════════════════════════════════════════════

alter type public.protocol_status add value if not exists 'interrupted';
alter type public.stage_outcome add value if not exists 'finished';
alter type public.stage_outcome add value if not exists 'interrupted';

-- ── start_tpo: aceita etapa inicial (padrão 1) e data de início ──
drop function if exists public.start_tpo(uuid, timestamptz, text);

create or replace function public.start_tpo(
  p_child_id       uuid,
  p_started_at     timestamptz default now(),
  p_note           text        default null,
  p_initial_stage  smallint    default 1
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_start    timestamptz := coalesce(p_started_at, now());
  v_stage    smallint := coalesce(p_initial_stage, 1);
  v_max      smallint := coalesce((select max(ordinal) from public.tpo_stages), 5);
  v_protocol uuid;
begin
  if v_user is null then
    raise exception 'Sessão não autenticada.' using errcode = '42501';
  end if;

  if v_stage < 1 or v_stage > v_max then
    raise exception 'Fora da sequência de etapas configurada.' using errcode = '22023';
  end if;

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
  values (v_user, p_child_id, v_start, 'active', v_stage)
  returning id into v_protocol;

  insert into public.stage_history (user_id, protocol_id, stage, started_at, note)
  values (v_user, v_protocol, v_stage, v_start, nullif(btrim(p_note), ''));

  return v_protocol;
end $$;

-- ── end_tpo: pausa, encerra ou interrompe o TPO ativo ───────────
create or replace function public.end_tpo(
  p_protocol_id uuid,
  p_outcome     public.stage_outcome,
  p_ended_at    timestamptz default now(),
  p_note        text        default null
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_user       uuid := auth.uid();
  v_at         timestamptz := coalesce(p_ended_at, now());
  v_status     public.protocol_status;
  v_new_status public.protocol_status;
begin
  if v_user is null then
    raise exception 'Sessão não autenticada.' using errcode = '42501';
  end if;

  select status into v_status
  from public.protocols
  where id = p_protocol_id and user_id = v_user
  for update;

  if v_status is null then
    raise exception 'Acompanhamento não encontrado.' using errcode = '42501';
  end if;

  if v_status <> 'active' then
    raise exception 'Este TPO já foi encerrado.' using errcode = '22023';
  end if;

  v_new_status := case p_outcome
    when 'paused'      then 'paused'::public.protocol_status
    when 'finished'    then 'finished'::public.protocol_status
    when 'interrupted' then 'interrupted'::public.protocol_status
    else null
  end;

  if v_new_status is null then
    raise exception 'Desfecho de TPO inválido.' using errcode = '22023';
  end if;

  -- Fecha o período aberto no histórico imutável (stage_history_freeze
  -- permite atualizar apenas ended_at, outcome e note na linha aberta).
  update public.stage_history
  set ended_at = v_at,
      outcome  = p_outcome,
      note     = coalesce(nullif(btrim(p_note), ''), note)
  where protocol_id = p_protocol_id
    and user_id = v_user
    and ended_at is null;

  update public.protocols
  set status   = v_new_status,
      ended_at = v_at
  where id = p_protocol_id
    and user_id = v_user;
end $$;
