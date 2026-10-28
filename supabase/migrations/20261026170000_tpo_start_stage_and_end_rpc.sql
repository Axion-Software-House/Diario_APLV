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
-- Review do PR #20 (itens 11 e 24):
--   3. A observação do início ficava em `stage_history.note`, a mesma coluna
--      da anotação de fechamento. `change_stage`/`end_tpo` faziam
--      `coalesce(novo, note)`: avançar sem anotação exibia a observação do
--      início como se fosse da transição; avançar com anotação a apagava.
--      Agora ela vive em `stage_history.start_note`, gravada só no insert e
--      congelada pelo `stage_history_freeze`.
--   4. `end_tpo` aceitava data anterior ao início do período aberto. Como o
--      histórico é imutável, o erro ficava permanente e o "Resumo por etapa"
--      mostrava dias negativos.
--   5. `start_tpo` e `end_tpo` aceitavam data no futuro (só o front
--      recusava). Mesma tolerância de 5 min de `FUTURE_TOLERANCE_MS`.
--   6. `change_stage` não conferia `protocols.status`: pela API dava para
--      mudar a etapa de um TPO pausado, encerrado ou interrompido.
--
-- Linguagem neutra: 'paused' (pausado), 'finished' (encerrado) e
-- 'interrupted' (interrompido) — nunca termos conclusivos.
-- ═══════════════════════════════════════════════════════════════

alter type public.protocol_status add value if not exists 'interrupted';
alter type public.stage_outcome add value if not exists 'finished';
alter type public.stage_outcome add value if not exists 'interrupted';

-- ── observação do início, separada da anotação de fechamento ───
-- `note` continua sendo a anotação de quem FECHA o período (transição ou
-- encerramento). `start_note` é o que a família escreveu ao iniciar o TPO.
-- Em produção o app nunca enviou `p_note` ao `start_tpo` antigo, então não
-- há observação de início misturada em `note` para migrar.
alter table public.stage_history
  add column if not exists start_note text;

comment on column public.stage_history.start_note is
  'Observação registrada ao iniciar o TPO. Gravada só no insert; imutável.';

-- O freeze passa a proteger também `start_note`: só `ended_at`, `outcome`
-- e `note` (o fechamento do período aberto) continuam atualizáveis.
create or replace function public.stage_history_freeze()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id          is distinct from old.id
  or new.user_id     is distinct from old.user_id
  or new.protocol_id is distinct from old.protocol_id
  or new.stage       is distinct from old.stage
  or new.started_at  is distinct from old.started_at
  or new.start_note  is distinct from old.start_note
  or new.created_at  is distinct from old.created_at then
    raise exception 'O histórico de etapas não pode ser reescrito.'
      using errcode = '42501';
  end if;

  return new;
end $$;

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

  -- Mesma tolerância de relógio do front (`FUTURE_TOLERANCE_MS`, 5 min).
  if v_start > now() + interval '5 minutes' then
    raise exception 'A data de início não pode estar no futuro.' using errcode = '22023';
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

  -- A observação do início vai para `start_note`; `note` fica livre para a
  -- anotação de quem fechar este período.
  insert into public.stage_history (user_id, protocol_id, stage, started_at, start_note)
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
  v_since      timestamptz;
begin
  if v_user is null then
    raise exception 'Sessão não autenticada.' using errcode = '42501';
  end if;

  select status, started_at into v_status, v_since
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

  if v_at > now() + interval '5 minutes' then
    raise exception 'A data não pode estar no futuro.' using errcode = '22023';
  end if;

  -- O encerramento não pode vir antes do início do período em curso: o
  -- histórico é imutável e um período com fim antes do começo ficaria para
  -- sempre com duração negativa. A comparação é por minuto porque o campo
  -- da tela não tem segundos: encerrar no mesmo minuto do início é aceito.
  select coalesce(max(started_at), v_since) into v_since
  from public.stage_history
  where protocol_id = p_protocol_id
    and user_id = v_user
    and ended_at is null;

  if v_at < date_trunc('minute', v_since) then
    raise exception 'A data não pode ser anterior ao início da etapa atual.'
      using errcode = '22023';
  end if;

  -- Fecha o período aberto no histórico imutável (stage_history_freeze
  -- permite atualizar apenas ended_at, outcome e note na linha aberta).
  -- `note` é só a anotação deste fechamento: não herda nada do período.
  update public.stage_history
  set ended_at = v_at,
      outcome  = p_outcome,
      note     = nullif(btrim(p_note), '')
  where protocol_id = p_protocol_id
    and user_id = v_user
    and ended_at is null;

  update public.protocols
  set status   = v_new_status,
      ended_at = v_at
  where id = p_protocol_id
    and user_id = v_user;
end $$;

-- ── change_stage: só em TPO ativo, sem herdar anotação ─────────
-- Redefinida aqui porque a versão vigente (`20260829120600_tpo_stages.sql`)
-- já foi aplicada. Muda só duas coisas:
--   • recusa protocolo que não está `active` (pausado, encerrado ou
--     interrompido) — antes isso só era barrado pela interface;
--   • a anotação do período que termina é a desta transição, sem
--     `coalesce` com o que já estivesse em `note`.
-- Assinatura, teto dinâmico, mensagens e o resto do fluxo ficam iguais.
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
  v_status  public.protocol_status;
  v_next    smallint;
  v_max     smallint := (select max(ordinal) from public.tpo_stages);
begin
  if v_user is null then
    raise exception 'Sessão não autenticada.' using errcode = '42501';
  end if;

  select current_stage, status into v_current, v_status
  from public.protocols
  where id = p_protocol_id and user_id = v_user
  for update;

  if v_current is null then
    raise exception 'Acompanhamento não encontrado.' using errcode = '42501';
  end if;

  if v_status <> 'active' then
    raise exception 'Este TPO não está em andamento.' using errcode = '22023';
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
      note     = nullif(btrim(p_note), '')
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
