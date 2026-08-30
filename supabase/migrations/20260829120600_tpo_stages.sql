-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — F0: sequência do TPO configurável  (README FINAL §22)
--
-- A escada do leite vivia hardcoded em src/constants/stages.ts. O cliente
-- pede que "o conteúdo/ordem do TPO possa ser ajustado posteriormente sem
-- reconstruir o app".
--
-- Esta tabela de referência guarda os rótulos e as explicações de cada
-- etapa. O app lê daqui (com fallback para constants/stages.ts). Ajustar a
-- escada = UPDATE nesta tabela, sem deploy.
--
-- IMPORTANTE: a sequência abaixo NÃO é protocolo universal. Ordem,
-- alimento, quantidade, duração e necessidade de supervisão variam
-- conforme o caso e seguem a orientação da equipe assistente.
-- ═══════════════════════════════════════════════════════════════

create table public.tpo_stages (
  ordinal            smallint primary key check (ordinal between 1 and 20),
  label              text not null,
  short_explanation  text,
  why_this_stage     text
);

insert into public.tpo_stages (ordinal, label, short_explanation, why_this_stage) values
  (1, 'Preparação assada',
      'Leite em pequena quantidade dentro de uma preparação bem assada.',
      'O calor prolongado altera parte das proteínas do leite; muitas crianças toleram esta forma antes das demais.'),
  (2, 'Derivado aquecido',
      'Leite ou derivado aquecido, com menos processamento que a preparação assada.',
      'Passo intermediário entre o alimento assado e o derivado in natura.'),
  (3, 'Queijo',
      'Queijos, conforme orientação da equipe assistente.',
      'Fermentação e maturação modificam as proteínas de forma diferente do aquecimento.'),
  (4, 'Iogurte',
      'Iogurte e leites fermentados.',
      'Derivado fermentado, sem o processamento térmico das etapas anteriores.'),
  (5, 'Leite',
      'Leite de vaca in natura.',
      'Última etapa da escada: o leite na forma que costuma ser mais reativa.');

-- Leitura pública controlada por RLS: a tabela é catálogo, igual para todos.
alter table public.tpo_stages enable row level security;
create policy tpo_stages_select on public.tpo_stages
  for select using (auth.uid() is not null);

-- ── change_stage: teto dinâmico ────────────────────────────────
-- Antes o limite era o literal `5`. Agora sai da tabela, então adicionar
-- uma etapa em tpo_stages já passa a valer sem mexer na função.
create or replace function public.change_stage(
  p_protocol_id uuid,
  p_outcome     public.stage_outcome,
  p_note        text        default null,
  p_at          timestamptz default now()
)
returns smallint
language plpgsql
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_at      timestamptz := coalesce(p_at, now());
  v_current smallint;
  v_next    smallint;
  v_max     smallint := (select max(ordinal) from public.tpo_stages);
begin
  if v_user is null then
    raise exception 'Sessão não autenticada.' using errcode = '42501';
  end if;

  select current_stage into v_current
  from public.protocols
  where id = p_protocol_id and user_id = v_user
  for update;

  if v_current is null then
    raise exception 'Acompanhamento não encontrado.' using errcode = '42501';
  end if;

  v_next := case p_outcome
    when 'advanced' then v_current + 1
    when 'repeated' then v_current
    when 'returned' then v_current - 1
    else null
  end;

  if v_next is null then
    raise exception 'Ação de etapa inválida.' using errcode = '22023';
  end if;

  if v_next < 1 or v_next > v_max then
    raise exception 'Fora da sequência de etapas configurada.' using errcode = '22023';
  end if;

  update public.stage_history
  set ended_at = v_at,
      outcome  = p_outcome,
      note     = coalesce(nullif(btrim(p_note), ''), note)
  where protocol_id = p_protocol_id
    and user_id = v_user
    and ended_at is null;

  insert into public.stage_history (user_id, protocol_id, stage, started_at)
  values (v_user, p_protocol_id, v_next, v_at);

  update public.protocols
  set current_stage = v_next
  where id = p_protocol_id and user_id = v_user;

  return v_next;
end $$;
