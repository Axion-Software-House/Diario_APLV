import type { ReactNode } from 'react'
import styles from './Card.module.css'

type Props = {
  /** `li` dentro de listas, `section` quando o bloco tem rótulo próprio. */
  as?: 'div' | 'section' | 'article' | 'li' | 'dl'
  /** Realce da borda — o cartão está selecionado ou é o registro corrente. */
  active?: boolean
  className?: string
  'aria-label'?: string
  children: ReactNode
}

/** A superfície do produto: fundo, borda e raio num lugar só. */
export function Card({ as: Tag = 'div', active = false, className, children, ...rest }: Props) {
  return (
    <Tag
      {...rest}
      className={[styles.card, active && styles.active, className].filter(Boolean).join(' ')}
    >
      {children}
    </Tag>
  )
}
