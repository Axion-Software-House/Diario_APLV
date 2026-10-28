-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — faixas plausíveis de "Peso e medidas" no banco
-- (QA 24/10/2026 e teste com cliente)
--
-- Ao esquecer a vírgula no celular ("785" em vez de "7,85"), o peso era
-- salvo como 785 kg e ia parar no Diário e no Relatório. O front passa a
-- recusar valores fora da faixa plausível e a pedir confirmação quando o
-- peso varia muito em relação ao anterior; esta migration garante as
-- mesmas faixas no banco para que nenhuma escrita direta (PostgREST) grave
-- uma medida impossível.
--
-- O registro `kind = 'weight'` virou "Peso e medidas" (pedido do cliente,
-- "dados do lastro" = medidas de crescimento). Em `data` (jsonb):
--   kg        peso, de 0,3 a 60 kg
--   lengthCm  comprimento ou altura, de 25 a 180 cm
--   headCm    perímetro cefálico, de 20 a 65 cm
-- Pelo menos uma das três é obrigatória. Cada uma que estiver presente tem
-- de ser número dentro da faixa (`"kg": null` ou `"kg": "7,85"` são
-- recusados). As faixas não são referência clínica: só barram erro de
-- digitação. As mesmas faixas estão em `MEASURE_SPECS`
-- (src/constants/health.ts).
--
-- Por que `NOT VALID`:
-- o próprio QA salvou um peso de 785 kg antes desta correção, e pode haver
-- outras linhas antigas fora da faixa ou com `kg` que não é número. Um
-- CHECK comum varre a tabela inteira ao ser criado e faria o `db push`
-- falhar por causa dessas linhas. Com `NOT VALID`, o Postgres não confere
-- as linhas que já existem, mas passa a conferir toda linha inserida ou
-- atualizada a partir de agora. Isso inclui UPDATE: editar só a observação
-- de uma linha antiga de 785 kg é recusado até o peso ser corrigido (o
-- formulário de edição já exige medidas válidas, então a família corrige o
-- valor ao salvar). Apagar a linha continua possível.
--
-- O `VALIDATE CONSTRAINT` só pode rodar DEPOIS que as linhas antigas forem
-- corrigidas (com a família, ou apagadas se forem de teste); antes disso
-- ele falha. Para encontrá-las (a mesma regra do CHECK, negada):
--
--   select id, child_id, user_id, occurred_at,
--          data -> 'kg' as kg, data -> 'lengthCm' as length_cm,
--          data -> 'headCm' as head_cm
--     from public.health_records
--    where kind = 'weight'
--      and not public.health_measures_are_plausible(data)
--    order by occurred_at;
--
-- Quando essa consulta voltar vazia:
--
--   alter table public.health_records
--     validate constraint health_records_weight_kg_check;
-- ═══════════════════════════════════════════════════════════════

-- Uma medida opcional: ausente passa; presente, só número na faixa.
-- O `case` impede o cast de texto para numeric (que daria erro em vez de
-- recusar a linha).
create or replace function public.health_measure_in_range(
  data jsonb, key text, low numeric, high numeric
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when not (data ? key) then true
    when jsonb_typeof(data -> key) = 'number' then
      (data ->> key)::numeric between low and high
    else false
  end
$$;

-- "Peso e medidas": pelo menos uma das três, e cada uma na faixa.
create or replace function public.health_measures_are_plausible(data jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    (data ? 'kg' or data ? 'lengthCm' or data ? 'headCm')
    and public.health_measure_in_range(data, 'kg', 0.3, 60)
    and public.health_measure_in_range(data, 'lengthCm', 25, 180)
    and public.health_measure_in_range(data, 'headCm', 20, 65),
    false
  )
$$;

alter table public.health_records
  drop constraint if exists health_records_weight_kg_check,
  add  constraint health_records_weight_kg_check check (
    case
      when kind = 'weight' then public.health_measures_are_plausible(data)
      else true
    end
  ) not valid;
