/** Seletores da fralda — enums diaper_* (M8). */
export const DIAPER_BLOOD = [
  { value: 'nao', label: 'Não' },
  { value: 'tracos', label: 'Traços' },
  { value: 'visivel', label: 'Visível' },
] as const

export const DIAPER_MUCUS = [
  { value: 'nao', label: 'Não' },
  { value: 'pouco', label: 'Pouco' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'muito', label: 'Muito' },
] as const

export const DIAPER_CONSISTENCY = [
  { value: 'habitual', label: 'Habitual' },
  { value: 'liquida', label: 'Líquida' },
  { value: 'pastosa', label: 'Pastosa' },
  { value: 'ressecada', label: 'Ressecada' },
  { value: 'nao_sei', label: 'Não sei' },
] as const

export type DiaperBlood = (typeof DIAPER_BLOOD)[number]['value']
export type DiaperMucus = (typeof DIAPER_MUCUS)[number]['value']
export type DiaperConsistency = (typeof DIAPER_CONSISTENCY)[number]['value']
