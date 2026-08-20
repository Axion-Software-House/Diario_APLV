import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Chip.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  /**
   * `soft` para escolhas de catálogo, `strong` para a intensidade do sintoma —
   * o toque que registra precisa de confirmação visual mais forte.
   */
  tone?: 'soft' | 'strong'
  /** Divide a largura da linha em partes iguais. */
  fill?: boolean
  children: ReactNode
}

/** Seleção por toque. Alvo ≥ --touch-min; digitação é exceção no Diário APLV. */
export function Chip({
  selected = false,
  tone = 'soft',
  fill = false,
  className,
  type = 'button',
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      type={type}
      aria-pressed={selected}
      className={[
        styles.chip,
        fill && styles.fill,
        selected && (tone === 'strong' ? styles.strong : styles.soft),
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
