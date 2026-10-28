import type { ReactNode } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import styles from './FormDetails.module.css'

type Props = {
  /** O rótulo do "+ Adicionar detalhes" — o texto continua o de cada formulário. */
  summary: string
  children: ReactNode
}

/**
 * Os campos opcionais recolhidos de um formulário de registro, no mesmo
 * cartão dos FormSection. `<details>` nativo: abre com Enter/Espaço e o
 * leitor de tela anuncia "recolhido/expandido" sem ARIA a mais.
 */
export function FormDetails({ summary, children }: Props) {
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>
        <span className={styles.plus} aria-hidden="true">
          <Plus size={18} />
        </span>
        <span className={styles.label}>{summary}</span>
        <ChevronDown size={20} aria-hidden="true" className={styles.chevron} />
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  )
}
