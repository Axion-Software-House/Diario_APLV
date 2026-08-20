import type { ReactNode } from 'react'
import styles from './FadeContent.module.css'

type Props = {
  /** Atraso em milissegundos — usado para escalonar itens de uma lista. */
  delay?: number
  className?: string
  children: ReactNode
}

/**
 * Entrada de conteúdo: fade + 8px, o único movimento de entrada que o
 * 04-design-system.md permite. Adaptado do FadeContent do ReactBits.
 *
 * O original usa gsap + ScrollTrigger; aqui é uma keyframe CSS. O efeito na
 * tela é o mesmo e o diário não carrega biblioteca de animação — que é o que
 * o design system pede desde o M0.
 *
 * `prefers-reduced-motion` zera a duração pela regra global de global.css.
 */
export function FadeContent({ delay = 0, className, children }: Props) {
  return (
    <div
      className={[styles.fade, className].filter(Boolean).join(' ')}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
