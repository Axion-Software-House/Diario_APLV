-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — F0: Produto / Higiene / Cosméticos  (README FINAL §10)
--
-- Registra mudanças de produto que possam coincidir no tempo com sintomas
-- de pele ou outras alterações. O app apenas registra — nunca conclui que
-- o produto causou nada.
--
-- `category` é texto (catálogo em src/constants/products.ts), evolui sem
-- migration. `is_new` responde "é um produto novo?". `name`/`brand`/`note`
-- são os detalhes opcionais.
-- ═══════════════════════════════════════════════════════════════

create table public.product_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  child_id     uuid not null references public.children (id) on delete cascade,
  protocol_id  uuid references public.protocols (id) on delete set null,
  stage        smallint check (stage between 1 and 5),
  occurred_at  timestamptz not null,
  category     text not null check (char_length(category) between 1 and 80),
  is_new       boolean,
  name         text check (name is null or char_length(name) between 1 and 120),
  brand        text check (brand is null or char_length(brand) between 1 and 120),
  note         text check (note is null or char_length(note) between 1 and 2000),
  created_at   timestamptz not null default now()
);
create index product_records_child_idx on public.product_records (child_id, occurred_at desc);

-- ── RLS ────────────────────────────────────────────────────────
alter table public.product_records enable row level security;

create policy product_records_select on public.product_records
  for select using (user_id = auth.uid());
create policy product_records_insert on public.product_records
  for insert with check (
    user_id = auth.uid()
    and public.owns_child(child_id)
    and (protocol_id is null or public.owns_protocol(protocol_id))
  );
create policy product_records_update on public.product_records
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.owns_child(child_id)
    and (protocol_id is null or public.owns_protocol(protocol_id))
  );
create policy product_records_delete on public.product_records
  for delete using (user_id = auth.uid());
