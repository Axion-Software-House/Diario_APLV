import type { CSSProperties } from 'react'
import type { EmojiKey } from '@/constants/emojis'
import { AREA_TONE, toneOfEmoji } from '@/constants/visual'
import styles from './EmojiBadge.module.css'

type Props = {
  /** O emoji, sempre de `EMOJI` (constants/emojis.ts). */
  emoji: string
  /** Área do tom; sem ela, o tom sai do próprio emoji (`toneOfEmoji`). */
  area?: EmojiKey
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/**
 * O emoji dentro de um círculo com o tom claro da área. Decorativo: o nome
 * vem sempre em texto ao lado (`aria-hidden`), e o `data-emoji` tira o
 * círculo do papel junto com o emoji (`@media print` de global.css).
 */
export function EmojiBadge({ emoji, area, size = 'md', className }: Props) {
  const tone = area ? AREA_TONE[area] : toneOfEmoji(emoji)

  return (
    <span
      className={[styles.badge, styles[size], className].filter(Boolean).join(' ')}
      style={{ '--emoji-tone': tone } as CSSProperties}
      aria-hidden="true"
      data-emoji
    >
      {emoji}
    </span>
  )
}
