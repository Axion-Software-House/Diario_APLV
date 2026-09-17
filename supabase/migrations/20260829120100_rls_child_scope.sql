-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — F0: RLS por criança nas tabelas de evento
--
-- Antes: a segunda checagem de posse era `owns_protocol(protocol_id)`.
-- Agora protocol_id é opcional, então a posse do PAI passa a ser a da
-- criança (`owns_child(child_id)`), e a do protocolo só é exigida quando
-- ele está presente.
--
-- Continua valendo a regra do M1: duas checagens, nunca uma.
--   1. user_id = auth.uid()
--   2. owns_child(child_id) AND (protocol_id IS NULL OR owns_protocol(protocol_id))
--
-- select / delete seguem por posse direta (user_id = auth.uid()).
-- ═══════════════════════════════════════════════════════════════

do $$
declare
  t text;
begin
  foreach t in array array[
    'exposures',
    'diaper_records',
    'notes'
  ]
  loop
    execute format('drop policy %I on public.%I', t || '_insert', t);
    execute format('drop policy %I on public.%I', t || '_update', t);

    execute format(
      'create policy %I on public.%I for insert with check (
         user_id = auth.uid()
         and public.owns_child(child_id)
         and (protocol_id is null or public.owns_protocol(protocol_id))
       )',
      t || '_insert', t);

    execute format(
      'create policy %I on public.%I for update using (user_id = auth.uid())
         with check (
           user_id = auth.uid()
           and public.owns_child(child_id)
           and (protocol_id is null or public.owns_protocol(protocol_id))
         )',
      t || '_update', t);
  end loop;
end $$;

-- ── symptom_events (pais: children + protocols? + exposures?) ──
drop policy symptom_events_insert on public.symptom_events;
drop policy symptom_events_update on public.symptom_events;

create policy symptom_events_insert on public.symptom_events
  for insert with check (
    user_id = auth.uid()
    and public.owns_child(child_id)
    and (protocol_id is null or public.owns_protocol(protocol_id))
    and public.owns_exposure(exposure_id)
  );

create policy symptom_events_update on public.symptom_events
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.owns_child(child_id)
    and (protocol_id is null or public.owns_protocol(protocol_id))
    and public.owns_exposure(exposure_id)
  );
