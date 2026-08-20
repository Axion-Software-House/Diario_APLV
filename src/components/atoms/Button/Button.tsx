import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Mostra o rótulo de espera e desabilita o botão — evita registro duplicado. */
  busy?: boolean
  busyLabel?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  busy = false,
  busyLabel = 'Salvando...',
  disabled,
  children,
  className,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled ?? busy}
      aria-busy={busy}
      className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
    >
      {busy ? busyLabel : children}
    </button>
  )
}
