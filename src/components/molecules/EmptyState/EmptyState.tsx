import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

type Props = {
  icon: LucideIcon
  title: string
  children: ReactNode
}

/** Explica o próximo passo. Nunca sugere que faltou algo à família. */
export function EmptyState({ icon: Icon, title, children }: Props) {
  return (
    <div className={styles.empty}>
      <Icon className={styles.icon} size={28} aria-hidden="true" />
      <p className={styles.title}>{title}</p>
      <p className={styles.text}>{children}</p>
    </div>
  )
}
