import type { TimelineKind } from '@/types'

/**
 * Filtros do Diário — um por tipo de registro para dar visão própria a
 * alimentação, sintomas, fraldas, produto, ambiente, saúde, TPO e observações.
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
  { id: 'products', label: 'Produto', kinds: ['product'] },
  { id: 'environments', label: 'Ambiente', kinds: ['environment'] },
  { id: 'health', label: 'Saúde', kinds: ['health'] },
  { id: 'tpo', label: 'TPO', kinds: ['stage'] },
  { id: 'notes', label: 'Observações', kinds: ['note'] },
] as const
