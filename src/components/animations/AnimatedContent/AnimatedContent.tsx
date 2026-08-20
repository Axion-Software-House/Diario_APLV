import type { ReactNode } from 'react'
import styles from './AnimatedContent.module.css'

type Props = {
  /** Posição do item na lista — define o escalonamento. */
  index?: number
  /** Teto do escalonamento: itens além disso entram todos juntos. */
  maxStagger?: number
  as?: 'div' | 'li'
  className?: string
  children: ReactNode
}

const STEP_MS = 40

/**
 * Entrada escalonada de uma lista. Adaptado do AnimatedContent do ReactBits,
 * que no original usa gsap + ScrollTrigger — aqui, keyframe CSS com atraso.
 *
 * O escalonamento tem teto: numa timeline de 200 registros, um atraso
 * proporcional deixaria os últimos itens aparecendo segundos depois. O
 * diário precisa estar legível de imediato.
 */
export function AnimatedContent({
  index = 0,
  maxStagger = 8,
  as: Tag = 'div',
  className,
  children,
}: Props) {
  const delay = Math.min(index, maxStagger) * STEP_MS

  return (
    <Tag
      className={[styles.item, className].filter(Boolean).join(' ')}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
