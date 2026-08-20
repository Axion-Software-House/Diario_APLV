import type { ReactNode } from 'react'
import styles from './Badge.module.css'

type Props = {
  tone?: 'neutral' | 'primary' | 'success' | 'danger'
  children: ReactNode
}

/** Rótulo curto de apoio — etapa, desfecho. Nunca é o conteúdo principal. */
export function Badge({ tone = 'neutral', children }: Props) {
  return <span className={[styles.badge, styles[tone]].join(' ')}>{children}</span>
}
