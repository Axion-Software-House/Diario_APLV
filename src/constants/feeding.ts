/**
 * Alimentação atual da criança — chips do onboarding (M3).
 * Gravado como texto em children.feeding.
 */
export const FEEDING_OPTIONS = [
  { code: 'leite_materno', label: 'Leite materno exclusivo' },
  { code: 'formula', label: 'Fórmula' },
  { code: 'misto', label: 'Leite materno + fórmula' },
  { code: 'com_solidos', label: 'Leite + alimentação sólida' },
  { code: 'outro', label: 'Outro' },
] as const

export type FeedingCode = (typeof FEEDING_OPTIONS)[number]['code']
