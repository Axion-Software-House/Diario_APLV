import { useEffect, useRef, useState } from 'react'

type Props = {
  to: number
  from?: number
  /** Teto do 04-design-system.md: nada acima de --duration-slow. */
  duration?: number
}

const REDUCED = '(prefers-reduced-motion: reduce)'

/**
 * Contagem animada de um número já apurado. Adaptado do CountUp do ReactBits,
 * que no original usa `motion/react` — aqui, um laço de rAF de vinte linhas.
 *
 * O valor final vai no `aria-label` desde o primeiro quadro: a animação é
 * decoração do número, nunca a fonte dele. Num relatório clínico, o número
 * na tela precisa ser o número do banco, inclusive enquanto anima.
 */
export function CountUp({ to, from = 0, duration = 320 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(to)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (window.matchMedia(REDUCED).matches) return

    let frame = 0
    let observer: IntersectionObserver | undefined

    const run = () => {
      const start = performance.now()
      const tick = () => {
        const progress = Math.min((performance.now() - start) / duration, 1)
        const eased = 1 - (1 - progress) ** 3
        setShown(Math.round(from + (to - from) * eased))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      setShown(from)
      frame = requestAnimationFrame(tick)
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer?.disconnect()
          run()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(element)

    return () => {
      observer?.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [to, from, duration])

  return (
    <span ref={ref} aria-label={String(to)}>
      <span aria-hidden="true">{shown}</span>
    </span>
  )
}
