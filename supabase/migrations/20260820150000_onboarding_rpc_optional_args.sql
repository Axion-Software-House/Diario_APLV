-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — create_onboarding: argumentos opcionais de verdade
--
-- Data de nascimento, alimentação, motivo e profissional são opcionais no
-- formulário. Sem `default null` o client era obrigado a mandar algum valor,
-- e string vazia em coluna `date` estoura com 22007 — o onboarding quebrava
-- exatamente no caminho mais comum (deixar a data em branco).
-- ═══════════════════════════════════════════════════════════════

create or replace function public.create_onboarding(
  p_child_name    text,
  p_birth_date    date        default null,
  p_feeding       text        default null,
  p_reason        text        default null,
  p_professional  text        default null,
  p_started_at    timestamptz default now()
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_child    uuid;
  v_protocol uuid;
  v_start    timestamptz := coalesce(p_started_at, now());
begin
  if v_user is null then
    raise exception 'Sessão não autenticada.' using errcode = '42501';
  end if;

  insert into public.children (user_id, name, birth_date, feeding)
  values (v_user, p_child_name, p_birth_date, nullif(p_feeding, ''))
  returning id into v_child;

  insert into public.protocols (
    user_id, child_id, reason, professional, started_at, status, current_stage
  )
  values (
    v_user, v_child, nullif(p_reason, ''), nullif(p_professional, ''), v_start, 'active', 1
  )
  returning id into v_protocol;

  insert into public.stage_history (user_id, protocol_id, stage, started_at)
  values (v_user, v_protocol, 1, v_start);

  return v_protocol;
end $$;
