import { useEffect, useRef } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import styles from './ClickSpark.module.css'

type Spark = { x: number; y: number; angle: number; start: number }

type Props = {
  /** Cor das fagulhas. Vem de um token, resolvido em tempo de execução. */
  colorToken?: string
  children: ReactNode
}

const COUNT = 8
const RADIUS = 14
const LENGTH = 8
/** Teto do 04-design-system.md: nada acima de --duration-slow. */
const DURATION = 320

/**
 * Fagulhas no toque. Adaptado do ClickSpark do ReactBits.
 *
 * É microinteração de botão, o único uso de canvas que o design system
 * permite. Fica em `pointer-events: none`, some sozinho e não roda quadro
 * nenhum enquanto não há fagulha: nunca chega perto de atrasar o salvamento.
 */
export function ClickSpark({ colorToken = '--color-primary', children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const sparks = useRef<Spark[]>([])
  const start = useRef<() => void>(() => {})

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return
    const context = canvas.getContext('2d')
    if (!context) return

    let frame = 0

    const tick = () => {
      const now = performance.now()
      const color = getComputedStyle(canvas).getPropertyValue(colorToken).trim()

      context.clearRect(0, 0, canvas.width, canvas.height)
      sparks.current = sparks.current.filter((spark) => now - spark.start < DURATION)

      for (const spark of sparks.current) {
        const progress = (now - spark.start) / DURATION
        const eased = progress * (2 - progress)
        const distance = eased * RADIUS
        const length = LENGTH * (1 - eased)

        context.strokeStyle = color
        context.globalAlpha = 1 - eased
        context.lineWidth = 2
        context.lineCap = 'round'
        context.beginPath()
        context.moveTo(
          spark.x + distance * Math.cos(spark.angle),
          spark.y + distance * Math.sin(spark.angle),
        )
        context.lineTo(
          spark.x + (distance + length) * Math.cos(spark.angle),
          spark.y + (distance + length) * Math.sin(spark.angle),
        )
        context.stroke()
      }

      context.globalAlpha = 1
      frame = sparks.current.length > 0 ? requestAnimationFrame(tick) : 0
    }

    start.current = () => {
      if (frame === 0) frame = requestAnimationFrame(tick)
    }

    const resize = () => {
      const { width, height } = wrapper.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
    }
    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(wrapper)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [colorToken])

  function handleClick(event: MouseEvent<HTMLSpanElement>) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const wrapper = wrapperRef.current
    if (!wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const now = performance.now()

    for (let index = 0; index < COUNT; index++) {
      sparks.current.push({ x, y, angle: (index * 2 * Math.PI) / COUNT, start: now })
    }
    start.current()
  }

  return (
    <span ref={wrapperRef} className={styles.wrapper} onClick={handleClick}>
      {children}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </span>
  )
}
