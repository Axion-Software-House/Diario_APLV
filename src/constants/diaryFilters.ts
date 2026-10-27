import type { TimelineKind } from '@/types'

/**
 * Filtros do Diário — um por tipo de registro para dar visão própria a
 * alimentação, sintomas, fraldas, produto, ambiente, saúde, TPO e observações.
 */
export type DiaryFilter = {
  id: string
  label: string
  emoji?: string
  /** `null` = todos os tipos. */
  kinds: readonly TimelineKind[] | null
}

export const DIARY_FILTERS: readonly DiaryFilter[] = [
  { id: 'all', label: 'Tudo', kinds: null },
  { id: 'food', label: 'Alimentação', emoji: '🍽️', kinds: ['exposure'] },
  { id: 'symptoms', label: 'Sintomas', emoji: '🩺', kinds: ['symptom', 'no_symptoms'] },
  { id: 'diapers', label: 'Fraldas', emoji: '👶', kinds: ['diaper'] },
  { id: 'products', label: 'Produto', emoji: '🧴', kinds: ['product'] },
  { id: 'environments', label: 'Ambiente', emoji: '📍', kinds: ['environment'] },
  { id: 'health', label: 'Saúde', emoji: '❤️‍🩹', kinds: ['health'] },
  { id: 'tpo', label: 'TPO', emoji: '🥛', kinds: ['stage'] },
  { id: 'notes', label: 'Observações', emoji: '📝', kinds: ['note'] },
] as const
