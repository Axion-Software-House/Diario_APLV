import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ClickSpark } from '@/components/animations/ClickSpark'
import styles from './Button.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Desliga a microinteração de toque — usado onde o botão é decoração. */
  spark?: boolean
  /** Mostra o rótulo de espera e desabilita o botão — evita registro duplicado. */
  busy?: boolean
  busyLabel?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  spark = true,
  busy = false,
  busyLabel = 'Salvando...',
  disabled,
  children,
  className,
  type = 'button',
  ...rest
}: Props) {
  const button = (
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

  // Botão travado não dá retorno de toque: o `saving` já é o retorno.
  if (!spark || busy || disabled) return button

  return (
    <ClickSpark colorToken={variant === 'primary' ? '--color-surface' : '--color-primary'}>
      {button}
    </ClickSpark>
  )
}
