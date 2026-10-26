-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — Saúde: Tratamento de medicamento e doses
--
-- Evolui o contrato de `health_records.data` para `kind = 'medication'`,
-- permitindo registrar tratamentos com início, dose, intervalo e duração
-- (em dias ou uso contínuo) e registrar cada dose administrada a partir
-- do tratamento, preservando também o registro de doses avulsas.
--
-- O app apenas registra o que foi prescrito pela equipe assistente;
-- nunca sugere medicamento, dose ou conduta.
-- ═══════════════════════════════════════════════════════════════

alter table public.health_records
  add constraint health_records_medication_data_check check (
    kind <> 'medication'
    or (
      (
        not (data ? 'entryType')
        or (data ->> 'entryType') in ('treatment', 'dose', 'single')
      )
      and (
        not (data ? 'durationMode')
        or (data ->> 'durationMode') in ('days', 'continuous')
      )
    )
  );

create index health_records_medication_treatment_idx
  on public.health_records (child_id, occurred_at desc)
  where kind = 'medication' and (data ->> 'entryType') = 'treatment';
