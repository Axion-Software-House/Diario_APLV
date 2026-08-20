-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — evento de sintomas em uma transação (M6)
--
-- Um registro de sintomas são duas escritas: o evento e os itens marcados.
-- Em requisições separadas, uma falha no meio deixaria um evento sem
-- nenhum item — indistinguível de lixo na timeline e no relatório, já que
-- "nenhum sintoma marcado" é justamente o que `no_symptoms = true` significa.
-- Aqui as duas acontecem ou nenhuma acontece.
--
-- `stage` NÃO vem do client: é lido do acompanhamento dentro da função.
-- O select do protocolo também confirma a posse — protocolo de outra
-- família não devolve linha, o evento não é criado e a chamada falha.
--
-- security invoker (padrão): a RLS continua valendo para cada insert.
-- ═══════════════════════════════════════════════════════════════

create function public.create_symptom_event(
  p_protocol_id  uuid,
  p_occurred_at  timestamptz default now(),
  -- [{"code": "mucus_stool", "intensity": 1}, ...]
  p_items        jsonb       default '[]'::jsonb,
  p_exposure_id  uuid        default null,
  p_no_symptoms  boolean     default false,
  p_note         text        default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_items jsonb := coalesce(p_items, '[]'::jsonb);
  v_event uuid;
begin
  if v_user is null then
    raise exception 'Sessão não autenticada.' using errcode = '42501';
  end if;

  -- "Sem sintomas" é a ausência de itens, não um item especial.
  if p_no_symptoms and jsonb_array_length(v_items) > 0 then
    raise exception 'Registro sem sintomas não aceita sintomas marcados.'
      using errcode = '22023';
  end if;

  if not p_no_symptoms and jsonb_array_length(v_items) = 0 then
    raise exception 'Marque ao menos um sintoma.' using errcode = '22023';
  end if;

  insert into public.symptom_events (
    user_id, protocol_id, exposure_id, stage, occurred_at, no_symptoms, note
  )
  select
    v_user,
    p.id,
    p_exposure_id,
    p.current_stage,
    coalesce(p_occurred_at, now()),
    p_no_symptoms,
    nullif(btrim(p_note), '')
  from public.protocols p
  where p.id = p_protocol_id and p.user_id = v_user
  returning id into v_event;

  if v_event is null then
    raise exception 'Acompanhamento não encontrado.' using errcode = '42501';
  end if;

  insert into public.symptom_event_items (user_id, symptom_event_id, code, intensity)
  select
    v_user,
    v_event,
    item ->> 'code',
    (item ->> 'intensity')::smallint
  from jsonb_array_elements(v_items) as item;

  return v_event;
end $$;
