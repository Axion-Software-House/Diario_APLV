-- ═══════════════════════════════════════════════════════════════
-- Diário APLV — enums
-- Cada enum reflete exatamente as opções de toque definidas no roadmap.
-- Mudar um valor aqui exige migration nova (nunca editar esta).
-- ═══════════════════════════════════════════════════════════════

-- protocolo (acompanhamento) ────────────────────────────────────
create type public.protocol_status as enum ('active', 'paused', 'finished');

-- histórico de etapas ───────────────────────────────────────────
create type public.stage_outcome as enum ('advanced', 'repeated', 'returned', 'paused');

-- exposição: quantidade (M5) ────────────────────────────────────
-- Pequena · Habitual · Maior que o habitual · Não sei
create type public.exposure_amount as enum ('pequena', 'habitual', 'maior', 'nao_sei');

-- fralda (M8) ───────────────────────────────────────────────────
-- Sangue: Não · Traços · Visível
create type public.diaper_blood as enum ('nao', 'tracos', 'visivel');

-- Muco: Não · Pouco · Moderado · Muito
create type public.diaper_mucus as enum ('nao', 'pouco', 'moderado', 'muito');

-- Consistência: Habitual · Líquida · Pastosa · Ressecada · Não sei
create type public.diaper_consistency as enum (
  'habitual', 'liquida', 'pastosa', 'ressecada', 'nao_sei'
);
