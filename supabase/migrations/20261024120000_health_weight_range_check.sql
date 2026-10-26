-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — faixa plausível de peso infantil no banco (QA 24/10/2026)
--
-- Ao esquecer a vírgula no celular ("785" em vez de "7,85"), o peso era
-- salvo como 785 kg e ia parar no Diário e no Relatório. O front passa a
-- recusar valores fora de [0,3 kg, 60 kg] e a pedir confirmação quando o
-- peso varia muito em relação ao anterior; esta migration garante a mesma
-- faixa plausível no banco para que nenhuma escrita direta (PostgREST)
-- grave um peso impossível em `health_records.data->>'kg'`.
-- ═══════════════════════════════════════════════════════════════

alter table public.health_records
  drop constraint if exists health_records_weight_kg_check,
  add  constraint health_records_weight_kg_check check (
    case
      when kind = 'weight' then
        case
          when jsonb_typeof(data -> 'kg') = 'number' then
            ((data ->> 'kg')::numeric between 0.3 and 60)
          else false
        end
      else true
    end
  );
