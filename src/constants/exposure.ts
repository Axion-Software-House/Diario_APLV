/** Quantidade da exposição — enum exposure_amount (M5). */
export const EXPOSURE_AMOUNTS = [
  { value: 'pequena', label: 'Pequena' },
  { value: 'habitual', label: 'Habitual' },
  { value: 'maior', label: 'Maior que o habitual' },
  { value: 'nao_sei', label: 'Não sei' },
] as const

export type ExposureAmount = (typeof EXPOSURE_AMOUNTS)[number]['value']

/** Quem consumiu — enum food_consumer (README FINAL §5). */
export const FOOD_CONSUMERS = [
  { value: 'mother', label: 'Mãe' },
  { value: 'child', label: 'Criança' },
] as const

export type FoodConsumerValue = (typeof FOOD_CONSUMERS)[number]['value']

/** Presença de leite ou derivados informada pela família — enum exposure_dairy. */
export const EXPOSURE_DAIRY_OPTIONS = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: 'nao_sei', label: 'Não sei' },
] as const

export type ExposureDairyValue = (typeof EXPOSURE_DAIRY_OPTIONS)[number]['value']
