import type { ReactNode } from 'react'
import { Card } from '@/components/molecules/Card'
import styles from './EmptyState.module.css'

type Props = {
  /** Emoji da área (`EMOJI` de constants/emojis.ts). Lucide fica só nos
   *  controles utilitários — docs/10-design-telas.md, "Emojis e rostinhos". */
  emoji: string
  title: string
  children: ReactNode
}

/** Explica o próximo passo. Nunca sugere que faltou algo à família. */
export function EmptyState({ emoji, title, children }: Props) {
  return (
    <Card className={styles.empty}>
      <span className={styles.emoji} aria-hidden="true" data-emoji>
        {emoji}
      </span>
      <p className={styles.title}>{title}</p>
      <p className={styles.text}>{children}</p>
    </Card>
  )
}
