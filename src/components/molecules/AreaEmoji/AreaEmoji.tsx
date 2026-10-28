import { EMOJI } from '@/constants/emojis'
import type { TimelineKind } from '@/types'
import styles from './AreaEmoji.module.css'

/**
 * As áreas do app que têm cor própria. A cor é um tom claro de fundo, só
 * para o reconhecimento rápido: não valora nada e nunca é a única pista (o
 * nome da área está sempre escrito ao lado).
 *
 * PROVISÓRIO: o mapa de tons por área (os fundos em AreaEmoji.module.css)
 * será unificado com o `AREA_TONE` do design system da fase 2.
 */
export type Area =
  | 'food'
  | 'symptom'
  | 'calm'
  | 'diaper'
  | 'product'
  | 'environment'
  | 'health'
  | 'note'
  | 'tpo'
  | 'report'
  | 'diary'
  | 'medication'
  | 'vaccine'
  | 'appointment'
  | 'weight'

const AREA_EMOJI: Record<Area, string> = {
  food: EMOJI.food,
  symptom: EMOJI.symptom,
  calm: EMOJI.calm,
  diaper: EMOJI.diaper,
  product: EMOJI.product,
  environment: EMOJI.environment,
  health: EMOJI.health,
  note: EMOJI.note,
  tpo: EMOJI.tpo,
  report: EMOJI.report,
  diary: EMOJI.diary,
  medication: EMOJI.medication,
  vaccine: EMOJI.vaccine,
  appointment: EMOJI.appointment,
  weight: EMOJI.weight,
}

/** A área de cada origem do Diário. Exaustivo: um `TimelineKind` novo não compila sem ela. */
export const KIND_AREA: Record<TimelineKind, Area> = {
  exposure: 'food',
  symptom: 'symptom',
  no_symptoms: 'calm',
  diaper: 'diaper',
  note: 'note',
  product: 'product',
  environment: 'environment',
  health: 'health',
  stage: 'tpo',
}

type Props = {
  area: Area
  /** sm 32px (listas), md 40px (Diário), lg 48px (atalhos e cabeçalhos). */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * O emoji da área dentro de um círculo com o tom claro dela. Decorativo:
 * `aria-hidden`, e `data-emoji` para sair do Relatório impresso. Sempre
 * acompanha o nome da área em texto.
 */
export function AreaEmoji({ area, size = 'md', className }: Props) {
  return (
    <span
      className={[styles.circle, styles[size], styles[area], className].filter(Boolean).join(' ')}
      aria-hidden="true"
      data-emoji
    >
      {AREA_EMOJI[area]}
    </span>
  )
}
