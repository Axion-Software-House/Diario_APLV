import { useEffect } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import styles from './Toast.module.css'

type Variant = 'success' | 'error' | 'info'

type Props = {
  message: string
  variant?: Variant
  onDismiss: () => void
  /** Erro fica até a pessoa fechar; confirmação some sozinha. */
  duration?: number
}

const ICONS = { success: CheckCircle2, error: TriangleAlert, info: Info } as const

/**
 * Confirmação passageira de uma ação já concluída. Nunca carrega informação
 * que só exista aqui: o registro salvo está na timeline de qualquer jeito.
 */
export function Toast({ message, variant = 'success', onDismiss, duration = 6000 }: Props) {
  useEffect(() => {
    if (variant === 'error' || duration <= 0) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [variant, duration, onDismiss])

  const Icon = ICONS[variant]

  return (
    <div
      className={[styles.toast, styles[variant]].join(' ')}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <Icon size={18} aria-hidden="true" className={styles.icon} />
      <span className={styles.message}>{message}</span>
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Fechar aviso">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
