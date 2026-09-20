-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — o teto de etapas deixa de ser 5 fixo
--
-- A Fase 4 tornou a escada do TPO configurável: `tpo_stages` é o catálogo
-- (`ordinal` aceita até 20) e `change_stage` já lê o teto de lá
-- (`v_max := select max(ordinal) from tpo_stages`). O aceite da fase diz
-- "editar `tpo_stages` no banco muda o app sem deploy".
--
-- Só que as 9 colunas que GUARDAM a etapa continuaram com o check fixo
-- `between 1 and 5` de `20260820120100_tables.sql` — e a Fase 2 ainda
-- repetiu esse limite nas três tabelas novas. O catálogo abria até 20; as
-- tabelas travavam em 5.
--
-- Efeito prático: cadastrar uma 6ª etapa em `tpo_stages` é aceito, e
-- `change_stage` passa a considerar v_max = 6 — mas a mudança de etapa
-- estoura no `update protocols set current_stage = 6` com violação de
-- check constraint. A configurabilidade que a F4 promete só funciona hoje
-- para RENOMEAR etapa; ADICIONAR etapa quebra em runtime.
--
-- Correção: as tabelas passam a usar o mesmo teto do catálogo (20). O
-- limite real continua onde pertence — `change_stage`, que lê
-- `tpo_stages` —, e o check vira só a sanidade de faixa.
-- ═══════════════════════════════════════════════════════════════

-- `protocols.current_stage` é a coluna que estourava primeiro.
alter table public.protocols
  drop constraint if exists protocols_current_stage_check,
  add  constraint protocols_current_stage_check check (current_stage between 1 and 20);

-- As tabelas de evento: `stage` é o ordinal da etapa em que o registro
-- aconteceu. `not null` nas antigas, nullable desde a F0 nas de evento —
-- a nulidade não muda aqui, só a faixa.
do $$
declare
  t text;
begin
  foreach t in array array[
    'stage_history',
    'exposures',
    'symptom_events',
    'diaper_records',
    'notes',
    'product_records',
    'environment_records',
    'health_records'
  ]
  loop
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_stage_check');
    execute format(
      'alter table public.%I add constraint %I check (stage between 1 and 20)',
      t, t || '_stage_check');
  end loop;
end $$;
