-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — F0: "Alimentação" (evolui `exposures`)
--
-- O registro de alimento deixa de ser só "exposição da criança durante o
-- TPO" e passa a valer para a MÃE também (dieta materna influencia o
-- lactente). README FINAL §5.
--
-- A tabela continua se chamando `exposures` de propósito: renomear tocaria
-- RLS, 3 RPCs, os tipos gerados e ~20 arquivos, sem ganho. O vocabulário
-- ("Alimentação", "quem consumiu") vive na camada de domínio/UI.
--
-- `food` (o "o que foi?") segue obrigatório e é o único campo de digitação
-- livre do fluxo rápido. `amount`, `brand` e `details` são os campos de
-- "+ Adicionar detalhes" — todos opcionais.
-- ═══════════════════════════════════════════════════════════════

create type public.food_consumer as enum ('mother', 'child');

alter table public.exposures
  add column consumer public.food_consumer not null default 'child',
  add column brand    text,
  add column details  text;
