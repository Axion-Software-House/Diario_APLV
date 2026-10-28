import { useCallback, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { formatDate } from '@/utils/dates'
import styles from './GrowthChart.module.css'

export type GrowthChartPoint = {
  id: string
  occurredAt: string
  value: number
}

type Props = {
  /** Nome da série, ex.: "Peso (kg)". Vira o título do gráfico. */
  title: string
  /** Pontos da mais antiga para a mais recente. */
  points: readonly GrowthChartPoint[]
  /** Valor com unidade, ex.: "7,85 kg". */
  formatValue: (value: number) => string
  /** Número curto do eixo, sem unidade, ex.: "7,5". */
  formatTick: (value: number) => string
}

const HEIGHT = 200
const PAD = { top: 20, right: 16, bottom: 32, left: 48 }
/** Largura usada antes da primeira medição — o mínimo que o app atende. */
const FALLBACK_WIDTH = 320

/** Três ou quatro marcas "redondas" que cobrem [min, max]. */
function niceTicks(min: number, max: number): number[] {
  const span = max - min || Math.abs(max) || 1
  const rough = span / 3
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toFixed(6)))
  return ticks
}

/**
 * Linha de uma medida no tempo (peso ou comprimento). Mostra só o que foi
 * registrado: sem curvas de percentil nem referência, que seriam
 * interpretação clínica. Um eixo, uma série; duas medidas de escalas
 * diferentes são dois gráficos.
 *
 * Acessível: título e descrição textual ligados ao gráfico, tabela com os
 * valores, e o mesmo destaque do ponteiro pelo teclado (setas).
 */
export function GrowthChart({ title, points, formatValue, formatTick }: Props) {
  const titleId = useId()
  const descId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(FALLBACK_WIDTH)
  const [active, setActive] = useState<number | null>(null)
  const hasPlot = points.length >= 2

  // A área do gráfico só existe com duas medidas ou mais: o ref de callback
  // liga o observador de largura quando ela aparece e desliga quando sai.
  const plotRef = useCallback((node: HTMLDivElement | null) => {
    wrapRef.current = node
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry?.contentRect.width ?? 0)
      if (next > 0) setWidth(next)
    })
    observer.observe(node)
    return () => {
      observer.disconnect()
      wrapRef.current = null
    }
  }, [])

  const first = points[0]
  const last = points.at(-1)

  const description =
    first && last
      ? points.length === 1
        ? `Uma medida registrada: ${formatValue(first.value)} em ${formatDate(first.occurredAt)}.`
        : `${points.length} medidas registradas, de ${formatDate(first.occurredAt)} (${formatValue(
            first.value,
          )}) a ${formatDate(last.occurredAt)} (${formatValue(last.value)}).`
      : 'Nenhuma medida registrada.'

  const geometry = useMemo(() => {
    if (!hasPlot) return null
    const times = points.map((point) => new Date(point.occurredAt).getTime())
    const values = points.map((point) => point.value)
    const minT = Math.min(...times)
    const maxT = Math.max(...times)
    const ticks = niceTicks(Math.min(...values), Math.max(...values))
    const minV = ticks[0] ?? Math.min(...values)
    const maxV = ticks.at(-1) ?? minV + 1
    const plotW = Math.max(1, width - PAD.left - PAD.right)
    const plotH = HEIGHT - PAD.top - PAD.bottom
    const x = (t: number) =>
      PAD.left + (maxT === minT ? plotW / 2 : ((t - minT) / (maxT - minT)) * plotW)
    const y = (v: number) => PAD.top + plotH - ((v - minV) / (maxV - minV || 1)) * plotH
    const coords = points.map((point) => ({
      id: point.id,
      x: x(new Date(point.occurredAt).getTime()),
      y: y(point.value),
    }))
    return { coords, ticks, y }
  }, [points, width, hasPlot])

  function nearest(clientX: number): number | null {
    const node = wrapRef.current
    if (!node || !geometry) return null
    const left = clientX - node.getBoundingClientRect().left
    let best = 0
    let bestDistance = Infinity
    geometry.coords.forEach((coord, index) => {
      const distance = Math.abs(coord.x - left)
      if (distance < bestDistance) {
        best = index
        bestDistance = distance
      }
    })
    return best
  }

  function handlePointer(event: PointerEvent<HTMLDivElement>) {
    setActive(nearest(event.clientX))
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!geometry) return
    const lastIndex = points.length - 1
    const current = active ?? lastIndex
    let next: number | null = null
    if (event.key === 'ArrowLeft') next = Math.max(0, current - 1)
    else if (event.key === 'ArrowRight') next = Math.min(lastIndex, current + 1)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = lastIndex
    else if (event.key === 'Escape') {
      setActive(null)
      return
    }
    if (next !== null) {
      event.preventDefault()
      setActive(next)
    }
  }

  const activePoint = active !== null ? points[active] : null
  const activeCoord = active !== null && geometry ? geometry.coords[active] : null
  const lastCoord = geometry?.coords.at(-1)

  return (
    <figure className={styles.figure} aria-labelledby={titleId}>
      <figcaption className={styles.caption}>
        <span id={titleId} className={styles.title}>
          {title}
        </span>
        <span id={descId} className={styles.description}>
          {description}
        </span>
      </figcaption>

      {geometry ? (
        <div
          ref={plotRef}
          className={styles.plot}
          tabIndex={0}
          role="group"
          aria-labelledby={titleId}
          aria-describedby={descId}
          aria-roledescription="gráfico"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((current) => current ?? points.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={handleKey}
        >
          <svg width={width} height={HEIGHT} className={styles.svg} aria-hidden="true">
            {geometry.ticks.map((tick) => (
              <g key={tick}>
                <line
                  className={styles.grid}
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={geometry.y(tick)}
                  y2={geometry.y(tick)}
                />
                <text
                  className={styles.tick}
                  x={PAD.left - 8}
                  y={geometry.y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {formatTick(tick)}
                </text>
              </g>
            ))}

            {first && last && (
              <>
                <text className={styles.tick} x={PAD.left} y={HEIGHT - 8} textAnchor="start">
                  {formatDate(first.occurredAt)}
                </text>
                <text className={styles.tick} x={width - PAD.right} y={HEIGHT - 8} textAnchor="end">
                  {formatDate(last.occurredAt)}
                </text>
              </>
            )}

            {activeCoord && (
              <line
                className={styles.crosshair}
                x1={activeCoord.x}
                x2={activeCoord.x}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
              />
            )}

            <polyline
              className={styles.line}
              points={geometry.coords.map((coord) => `${coord.x},${coord.y}`).join(' ')}
            />

            {geometry.coords.map((coord, index) => (
              <circle
                key={coord.id}
                className={index === active ? styles.markerActive : styles.marker}
                cx={coord.x}
                cy={coord.y}
                r={index === active ? 6 : 4}
              />
            ))}

            {/* Rótulo direto só no último ponto; os demais ficam no destaque e na tabela. */}
            {lastCoord && last && active === null && (
              <text
                className={styles.endLabel}
                x={lastCoord.x}
                y={Math.max(14, lastCoord.y - 12)}
                textAnchor="end"
              >
                {formatValue(last.value)}
              </text>
            )}
          </svg>

          {activePoint && activeCoord && (
            <div
              className={styles.tooltip}
              style={{
                left: Math.min(Math.max(activeCoord.x, 72), width - 72),
              }}
            >
              <strong className={styles.tooltipValue}>{formatValue(activePoint.value)}</strong>
              <span className={styles.tooltipDate}>{formatDate(activePoint.occurredAt)}</span>
            </div>
          )}
          <p className={styles.srOnly} aria-live="polite">
            {activePoint
              ? `${formatValue(activePoint.value)} em ${formatDate(activePoint.occurredAt)}`
              : ''}
          </p>
        </div>
      ) : (
        <p className={styles.single}>A linha aparece a partir de duas medidas registradas.</p>
      )}

      {points.length > 0 && (
        <details className={styles.details}>
          <summary className={styles.summary}>Ver os valores em tabela</summary>
          <table className={styles.table}>
            <caption className={styles.srOnly}>{title}</caption>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              {points.toReversed().map((point) => (
                <tr key={point.id}>
                  <td>{formatDate(point.occurredAt)}</td>
                  <td>{formatValue(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </figure>
  )
}
