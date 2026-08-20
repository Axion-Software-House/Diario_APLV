/** Quantidade da exposição — enum exposure_amount (M5). */
export const EXPOSURE_AMOUNTS = [
  { value: 'pequena', label: 'Pequena' },
  { value: 'habitual', label: 'Habitual' },
  { value: 'maior', label: 'Maior que o habitual' },
  { value: 'nao_sei', label: 'Não sei' },
] as const

export type ExposureAmount = (typeof EXPOSURE_AMOUNTS)[number]['value']
