-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — Alimentação: presença de leite ou derivados
--
-- Registra a resposta da família à pergunta "Continha leite ou derivados?"
-- (Sim · Não · Não sei). Quem informa é a família; o app apenas registra
-- sem inferir nem decidir com base no texto do alimento ou dos ingredientes.
-- ═══════════════════════════════════════════════════════════════

create type public.exposure_dairy as enum ('sim', 'nao', 'nao_sei');

alter table public.exposures
  add column contains_dairy public.exposure_dairy;
