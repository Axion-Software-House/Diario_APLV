-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — F0: desacoplar os eventos do diário do TPO
--
-- Até aqui o produto ERA o registro de um TPO: toda tabela de evento
-- tinha `protocol_id NOT NULL` e `stage NOT NULL`. A nova arquitetura
-- (docs/08-plano-implementacao.md) coloca a CRIANÇA como sujeito e o TPO
-- como um módulo opcional.
--
-- Depois desta migration:
--   • todo evento pertence a uma criança  (child_id NOT NULL)
--   • protocol_id / stage viram opcionais  (preenchidos só durante um TPO)
--
-- Banco de produção só tem dados de teste; o backfill de child_id sai
-- direto de protocols.child_id, que hoje é obrigatório em cada linha.
-- ═══════════════════════════════════════════════════════════════

-- ── exposures ──────────────────────────────────────────────────
alter table public.exposures
  add column child_id uuid references public.children (id) on delete cascade;

update public.exposures e
  set child_id = p.child_id
  from public.protocols p
  where p.id = e.protocol_id;

alter table public.exposures
  alter column child_id set not null,
  alter column protocol_id drop not null,
  alter column stage drop not null;

create index exposures_child_idx on public.exposures (child_id, occurred_at desc);

-- ── symptom_events ─────────────────────────────────────────────
alter table public.symptom_events
  add column child_id uuid references public.children (id) on delete cascade;

update public.symptom_events s
  set child_id = p.child_id
  from public.protocols p
  where p.id = s.protocol_id;

alter table public.symptom_events
  alter column child_id set not null,
  alter column protocol_id drop not null,
  alter column stage drop not null;

create index symptom_events_child_idx on public.symptom_events (child_id, occurred_at desc);

-- ── diaper_records ─────────────────────────────────────────────
alter table public.diaper_records
  add column child_id uuid references public.children (id) on delete cascade;

update public.diaper_records d
  set child_id = p.child_id
  from public.protocols p
  where p.id = d.protocol_id;

alter table public.diaper_records
  alter column child_id set not null,
  alter column protocol_id drop not null,
  alter column stage drop not null;

create index diaper_records_child_idx on public.diaper_records (child_id, occurred_at desc);

-- ── notes ──────────────────────────────────────────────────────
alter table public.notes
  add column child_id uuid references public.children (id) on delete cascade;

update public.notes n
  set child_id = p.child_id
  from public.protocols p
  where p.id = n.protocol_id;

alter table public.notes
  alter column child_id set not null,
  alter column protocol_id drop not null,
  alter column stage drop not null;

create index notes_child_idx on public.notes (child_id, occurred_at desc);
