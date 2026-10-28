import { EMOJI } from '@/constants/emojis'
import type { TimelineKind } from '@/types'

/**
 * Filtros do Diário — um por tipo de registro para dar visão própria a
 * alimentação, sintomas, tudo tranquilo, fraldas, produto, ambiente, saúde,
 * TPO e observações. "Tudo tranquilo" tem filtro próprio: somado a
 * "Sintomas", a contagem do resumo diria que houve mais sintomas do que houve.
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
  { id: 'food', label: 'Alimentação', emoji: EMOJI.food, kinds: ['exposure'] },
  { id: 'symptoms', label: 'Sintomas', emoji: EMOJI.symptom, kinds: ['symptom'] },
  { id: 'calm', label: 'Tudo tranquilo', emoji: EMOJI.calm, kinds: ['no_symptoms'] },
  { id: 'diapers', label: 'Fraldas', emoji: EMOJI.diaper, kinds: ['diaper'] },
  { id: 'products', label: 'Produto', emoji: EMOJI.product, kinds: ['product'] },
  { id: 'environments', label: 'Ambiente', emoji: EMOJI.environment, kinds: ['environment'] },
  { id: 'health', label: 'Saúde', emoji: EMOJI.health, kinds: ['health'] },
  { id: 'tpo', label: 'TPO', emoji: EMOJI.tpo, kinds: ['stage'] },
  { id: 'notes', label: 'Observações', emoji: EMOJI.note, kinds: ['note'] },
] as const
