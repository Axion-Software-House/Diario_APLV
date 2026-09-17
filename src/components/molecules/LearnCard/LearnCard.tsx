import { ChevronDown } from 'lucide-react'
import { LEARN_CONTENT_READY } from '@/constants/learn'
import type { LearnCard as LearnCardData } from '@/constants/learn'
import styles from './LearnCard.module.css'

type Props = { card: LearnCardData }

/**
 * Um card de pergunta e resposta. A pergunta aparece sempre; a resposta só
 * quando o conteúdo foi validado clinicamente e liberado
 * (`LEARN_CONTENT_READY`). Nunca mostra texto pela metade.
 */
export function LearnCard({ card }: Props) {
  const ready = LEARN_CONTENT_READY && Boolean(card.body)

  return (
    <details className={styles.card}>
      <summary className={styles.summary}>
        <span>{card.question}</span>
        <ChevronDown size={18} aria-hidden="true" className={styles.chevron} />
      </summary>
      <div className={styles.body}>
        {ready ? (
          <p>{card.body}</p>
        ) : (
          <p className={styles.pending}>
            Este conteúdo está em revisão clínica e ficará disponível em breve.
          </p>
        )}
      </div>
    </details>
  )
}
