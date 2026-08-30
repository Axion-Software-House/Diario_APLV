-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — F0: motivo e profissional passam a descrever a CRIANÇA
--
-- Eram campos de `protocols` porque o protocolo era o acompanhamento.
-- Agora o acompanhamento longitudinal É a criança; o motivo do
-- acompanhamento e o profissional que acompanha vivem nela.
--
-- `protocols.reason` / `protocols.professional` continuam existindo para
-- descrever aquele TPO específico (pode haver mais de um ao longo do tempo),
-- mas não são mais preenchidos pelo onboarding.
-- ═══════════════════════════════════════════════════════════════

alter table public.children
  add column reason        text check (reason is null or char_length(reason) between 1 and 2000),
  add column professional  text check (professional is null or char_length(professional) between 1 and 200);

-- Backfill: leva o que o onboarding gravou no primeiro protocolo da criança.
update public.children c
  set reason = p.reason,
      professional = p.professional
  from (
    select distinct on (child_id) child_id, reason, professional
    from public.protocols
    order by child_id, started_at asc
  ) p
  where p.child_id = c.id
    and (p.reason is not null or p.professional is not null);
