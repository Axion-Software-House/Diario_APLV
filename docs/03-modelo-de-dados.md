# 03 — Modelo de Dados

> ⚠️ O README referencia um schema "definido anteriormente" que não está no arquivo.
> O schema abaixo é uma **proposta derivada das entidades listadas** (`User`, `Child`,
> `Protocol`, `StageHistory`, `Exposure`, `SymptomEvent`, `SymptomItem`, `DiaperRecord`,
> `Note`, `TimelineEvent`). Validar antes do M2.

## Diagrama

```
auth.users
   └── profiles (1:1)
         └── children (1:N)
               └── protocols (1:N)
                     ├── stage_history (1:N)
                     ├── exposures (1:N)
                     ├── symptom_events (1:N) ── symptom_items (1:N)
                     ├── diaper_records (1:N)
                     └── notes (1:N)

timeline_events  → VIEW (union de exposures + symptom_events + diaper_records + notes + stage_history)
```

Toda tabela filha carrega `user_id` denormalizado. Motivo: RLS simples e rápida
(`user_id = auth.uid()`), sem JOIN recursivo em cada policy.

## Schema SQL

```sql
-- ── profiles ───────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now()
);

-- ── children ───────────────────────────────────────────────
create table public.children (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  birth_date  date,
  created_at  timestamptz not null default now()
);
create index on public.children (user_id);

-- ── protocols ──────────────────────────────────────────────
create type protocol_status as enum ('active', 'paused', 'finished');

create table public.protocols (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  child_id       uuid not null references public.children(id) on delete cascade,
  title          text,
  current_stage  smallint not null default 1 check (current_stage between 1 and 6),
  status         protocol_status not null default 'active',
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  created_at     timestamptz not null default now()
);
create index on public.protocols (user_id, child_id);

-- ── stage_history ──────────────────────────────────────────
create type stage_outcome as enum ('advanced', 'repeated', 'returned', 'paused');

create table public.stage_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  protocol_id  uuid not null references public.protocols(id) on delete cascade,
  stage        smallint not null check (stage between 1 and 6),
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  outcome      stage_outcome,
  note         text,
  created_at   timestamptz not null default now()
);
create index on public.stage_history (protocol_id, started_at desc);

-- ── exposures ──────────────────────────────────────────────
create table public.exposures (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  protocol_id  uuid not null references public.protocols(id) on delete cascade,
  stage        smallint not null check (stage between 1 and 6),
  occurred_at  timestamptz not null,
  description  text not null,                 -- o que a mãe consumiu
  amount       text,                          -- livre: "1 colher", "1 fatia"
  note         text,
  created_at   timestamptz not null default now()
);
create index on public.exposures (protocol_id, occurred_at desc);

-- ── symptom_events ─────────────────────────────────────────
-- has_symptoms = false representa o registro "sem sintomas"
create table public.symptom_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  protocol_id  uuid not null references public.protocols(id) on delete cascade,
  exposure_id  uuid references public.exposures(id) on delete set null,
  occurred_at  timestamptz not null,
  has_symptoms boolean not null default true,
  note         text,
  created_at   timestamptz not null default now()
);
create index on public.symptom_events (protocol_id, occurred_at desc);

-- ── symptom_items ──────────────────────────────────────────
create table public.symptom_items (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  symptom_event_id uuid not null references public.symptom_events(id) on delete cascade,
  code             text not null,             -- ver constants/symptoms.ts
  intensity        smallint check (intensity between 1 and 3),
  created_at       timestamptz not null default now()
);
create index on public.symptom_items (symptom_event_id);

-- ── diaper_records ─────────────────────────────────────────
create type diaper_consistency as enum ('liquida','pastosa','normal','ressecada');

create table public.diaper_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  protocol_id  uuid not null references public.protocols(id) on delete cascade,
  occurred_at  timestamptz not null,
  consistency  diaper_consistency,
  color        text,
  has_blood    boolean not null default false,
  has_mucus    boolean not null default false,
  note         text,
  created_at   timestamptz not null default now()
);
create index on public.diaper_records (protocol_id, occurred_at desc);

-- ── notes ──────────────────────────────────────────────────
create table public.notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  protocol_id  uuid not null references public.protocols(id) on delete cascade,
  occurred_at  timestamptz not null default now(),
  content      text not null,
  created_at   timestamptz not null default now()
);
create index on public.notes (protocol_id, occurred_at desc);
```

## View de timeline

```sql
create or replace view public.timeline_events as
  select id, user_id, protocol_id, occurred_at, 'exposure'::text as kind,
         description as title, note as detail
    from public.exposures
  union all
  select id, user_id, protocol_id, occurred_at, 'symptom',
         case when has_symptoms then 'Sintomas registrados' else 'Sem sintomas' end, note
    from public.symptom_events
  union all
  select id, user_id, protocol_id, occurred_at, 'diaper', 'Registro de fralda', note
    from public.diaper_records
  union all
  select id, user_id, protocol_id, occurred_at, 'note', 'Anotação', content
    from public.notes
  union all
  select id, user_id, protocol_id, started_at, 'stage',
         'Etapa ' || stage::text, note
    from public.stage_history;
```

A view herda a RLS das tabelas base (criar com `security_invoker = true` no Postgres 15+):

```sql
alter view public.timeline_events set (security_invoker = on);
```

## RLS

Padrão idêntico para **todas** as tabelas:

```sql
alter table public.<tabela> enable row level security;

create policy "<tabela>_select" on public.<tabela>
  for select using (user_id = auth.uid());
create policy "<tabela>_insert" on public.<tabela>
  for insert with check (user_id = auth.uid());
create policy "<tabela>_update" on public.<tabela>
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "<tabela>_delete" on public.<tabela>
  for delete using (user_id = auth.uid());
```

Em `profiles`, trocar `user_id` por `id`.

Trigger para criar o profile no signup:

```sql
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## Tipos

- `types/database.ts` — **gerado**: `npx supabase gen types typescript --project-id <id> > src/types/database.ts`
- `types/domain.ts` — tipos usados pela UI (`Child`, `Protocol`, `Exposure`, `TimelineEvent`, ...), derivados dos gerados com `Tables<'children'>` etc.
- `types/index.ts` — reexporta.

Serviços convertem `database` → `domain`. A UI só conhece `domain`.

## Constantes propostas (validar clinicamente)

`constants/stages.ts` — escada do leite na dieta materna. **Sem regra automática de avanço.**

```ts
export const STAGES = [
  { id: 1, label: 'Etapa 1', description: 'Leite bem assado em preparo (ex.: biscoito)' },
  { id: 2, label: 'Etapa 2', description: 'Leite assado em preparo mais úmido (ex.: bolo/muffin)' },
  { id: 3, label: 'Etapa 3', description: 'Leite cozido / queijo cozido' },
  { id: 4, label: 'Etapa 4', description: 'Derivados fermentados (ex.: iogurte, queijo)' },
  { id: 5, label: 'Etapa 5', description: 'Leite integral em pequena quantidade' },
  { id: 6, label: 'Etapa 6', description: 'Leite e derivados livres' },
] as const
```

`constants/symptoms.ts`:

```ts
export const SYMPTOMS = [
  { code: 'skin_rash', label: 'Manchas na pele', group: 'pele' },
  { code: 'eczema', label: 'Eczema/coceira', group: 'pele' },
  { code: 'vomit', label: 'Vômito', group: 'digestivo' },
  { code: 'reflux', label: 'Refluxo', group: 'digestivo' },
  { code: 'colic', label: 'Cólica', group: 'digestivo' },
  { code: 'diarrhea', label: 'Diarreia', group: 'digestivo' },
  { code: 'constipation', label: 'Constipação', group: 'digestivo' },
  { code: 'blood_stool', label: 'Sangue nas fezes', group: 'digestivo' },
  { code: 'mucus_stool', label: 'Muco nas fezes', group: 'digestivo' },
  { code: 'irritability', label: 'Irritabilidade', group: 'geral' },
  { code: 'sleep_change', label: 'Alteração do sono', group: 'geral' },
  { code: 'congestion', label: 'Congestão nasal', group: 'respiratorio' },
  { code: 'wheezing', label: 'Chiado no peito', group: 'respiratorio' },
] as const
```

Sintomas de alarme (`blood_stool`, `wheezing`) exibem `SafetyAlert` orientando **procurar
o profissional de saúde** — nunca um diagnóstico.
