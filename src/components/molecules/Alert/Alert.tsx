import { CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './Alert.module.css'

type Variant = 'success' | 'error' | 'info'

type Props = {
  variant?: Variant
  children: ReactNode
}

const ICONS = { success: CheckCircle2, error: TriangleAlert, info: Info } as const

/** Feedback curto de uma ação. Erro é anunciado na hora; o resto, educadamente. */
export function Alert({ variant = 'info', children }: Props) {
  const Icon = ICONS[variant]

  return (
    <p
      className={[styles.alert, styles[variant]].join(' ')}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <Icon className={styles.icon} size={18} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
