-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — faixa plausível de peso infantil no banco (QA 24/10/2026)
--
-- Ao esquecer a vírgula no celular ("785" em vez de "7,85"), o peso era
-- salvo como 785 kg e ia parar no Diário e no Relatório. O front passa a
-- recusar valores fora de [0,3 kg, 60 kg] e a pedir confirmação quando o
-- peso varia muito em relação ao anterior; esta migration garante a mesma
-- faixa plausível no banco para que nenhuma escrita direta (PostgREST)
-- grave um peso impossível em `health_records.data->>'kg'`.
--
-- Por que `NOT VALID`:
-- o próprio QA salvou um peso de 785 kg antes desta correção, e pode haver
-- outras linhas antigas fora da faixa ou com `kg` que não é número. Um
-- CHECK comum varre a tabela inteira ao ser criado e faria o `db push`
-- falhar por causa dessas linhas. Com `NOT VALID`, o Postgres não confere
-- as linhas que já existem, mas passa a conferir toda linha inserida ou
-- atualizada a partir de agora. Isso inclui UPDATE: editar só a observação
-- de uma linha antiga de 785 kg é recusado até o peso ser corrigido (o
-- formulário de edição já exige um peso válido, então a família corrige o
-- peso ao salvar). Apagar a linha continua possível.
--
-- O `VALIDATE CONSTRAINT` só pode rodar DEPOIS que as linhas antigas forem
-- corrigidas (com a família, ou apagadas se forem de teste); antes disso
-- ele falha. Para encontrá-las:
--
--   select id, child_id, user_id, occurred_at, data -> 'kg' as kg
--     from public.health_records
--    where kind = 'weight'
--      and (
--        jsonb_typeof(data -> 'kg') is distinct from 'number'
--        or (
--          jsonb_typeof(data -> 'kg') = 'number'
--          and (data ->> 'kg')::numeric not between 0.3 and 60
--        )
--      )
--    order by occurred_at;
--
-- Quando essa consulta voltar vazia:
--
--   alter table public.health_records
--     validate constraint health_records_weight_kg_check;
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
  ) not valid;
