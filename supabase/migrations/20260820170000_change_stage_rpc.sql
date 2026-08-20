-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — mudança de etapa em uma transação (M9)
--
-- Avançar, repetir ou retornar são TRÊS escritas: fechar o período
-- corrente, abrir o período novo e mover protocols.current_stage.
-- Separadas, uma falha no meio deixaria o acompanhamento em um estado
-- que nunca foi vivido -- dois períodos abertos, ou a etapa do protocolo
-- discordando do histórico. O relatório do M10 lê os dois.
--
-- O histórico é IMUTÁVEL no que já foi vivido: o período anterior recebe
-- ended_at e outcome e continua lá. Nada é apagado, nada é reescrito.
--
-- A função NÃO decide nada. Ela recebe a decisão humana já tomada e
-- calcula apenas a aritmética da etapa. Não existe regra de avanço
-- automático em lugar nenhum do produto.
--
-- security invoker (padrão): a RLS continua valendo para cada escrita.
-- ═══════════════════════════════════════════════════════════════

create function public.change_stage(
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
begin
  if v_user is null then
    raise exception 'Sessão não autenticada.' using errcode = '42501';
  end if;

  -- O for update segura a linha até o fim da transação: dois toques
  -- simultâneos no botão não podem pular duas etapas.
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
    -- 'paused' encerra o acompanhamento, não muda de etapa: outro fluxo.
    else null
  end;

  if v_next is null then
    raise exception 'Ação de etapa inválida.' using errcode = '22023';
  end if;

  if v_next < 1 or v_next > 5 then
    raise exception 'A escada tem 5 etapas.' using errcode = '22023';
  end if;

  -- Fecha o período corrente. O update toca só ended_at, outcome e note:
  -- stage e started_at, que são o que foi vivido, ficam intactos.
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
