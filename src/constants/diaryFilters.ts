import type { TimelineKind } from '@/types'

/**
 * Filtros do Diário — README FINAL §18. Poucos, agrupados: "Outros" junta
 * observação, produto, ambiente, saúde e mudanças de etapa.
 */
export type DiaryFilter = {
  id: string
  label: string
  /** `null` = todos os tipos. */
  kinds: readonly TimelineKind[] | null
}

export const DIARY_FILTERS: readonly DiaryFilter[] = [
  { id: 'all', label: 'Tudo', kinds: null },
  { id: 'food', label: 'Alimentação', kinds: ['exposure'] },
  { id: 'symptoms', label: 'Sintomas', kinds: ['symptom', 'no_symptoms'] },
  { id: 'diapers', label: 'Fraldas', kinds: ['diaper'] },
  {
    id: 'others',
    label: 'Outros',
    kinds: ['note', 'product', 'environment', 'health', 'stage'],
  },
] as const
