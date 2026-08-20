import { useRef } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import styles from './SpotlightCard.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * Brilho que segue o ponteiro dentro do cartão. Adaptado do SpotlightCard do
 * ReactBits — o original é escuro e com valores crus; aqui o gradiente sai
 * dos tokens do projeto.
 *
 * Só reage a ponteiro: no celular, onde o diário é usado, não custa nada.
 */
export function SpotlightCard({ className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const element = ref.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    element.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`)
    element.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={[styles.spotlight, className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
