import { useId } from 'react'
import type { CSSProperties } from 'react'
import { formatShortDate } from '@/utils/dates'
import a11y from '@/components/molecules/charts/srOnly.module.css'
import styles from './Sparkline.module.css'

export type SparklinePoint = {
  id: string
  occurredAt: string
  value: number
}

type Props = {
  /** Título visível, ex.: "Peso". */
  title: string
  /** Da medida mais antiga para a mais recente. */
  points: readonly SparklinePoint[]
  /** Valor com unidade, ex.: "7,85 kg". */
  formatValue: (value: number) => string
}

/** Sistema de coordenadas do traço; o SVG estica para a largura do cartão. */
const VIEW_W = 100
const VIEW_H = 40
/** Respiro vertical para o traço não encostar nas bordas. */
const PAD = 4

/**
 * Mini gráfico de uma medida no tempo (o peso no painel da Home). Uma série,
 * um eixo, só o que foi registrado: sem curva de referência, sem tendência
 * calculada. O primeiro e o último valor ficam escritos em texto; o traço é
 * decorativo para o leitor de tela, que lê a descrição equivalente.
 *
 * O traço usa `viewBox` esticado (com espessura fixa) e os pontos são HTML
 * posicionados em porcentagem, para continuarem redondos em qualquer largura.
 */
export function Sparkline({ title, points, formatValue }: Props) {
  const descId = useId()
  const first = points[0]
  const last = points.at(-1)
  if (!first || !last) return null

  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const times = points.map((point) => new Date(point.occurredAt).getTime())
  const t0 = times[0] ?? 0
  const tSpan = (times.at(-1) ?? 0) - t0 || 1

  const coords = points.map((point, index) => {
    const x = points.length === 1 ? 50 : (((times[index] ?? t0) - t0) / tSpan) * 100
    const y = PAD + (1 - (point.value - min) / span) * (VIEW_H - PAD * 2)
    return { point, x, y }
  })
  const path = coords
    .map(
      ({ x, y }, index) =>
        `${index === 0 ? 'M' : 'L'}${((x / 100) * VIEW_W).toFixed(2)} ${y.toFixed(2)}`,
    )
    .join(' ')

  const description =
    points.length === 1
      ? `Uma medida registrada: ${formatValue(first.value)} em ${formatShortDate(first.occurredAt)}.`
      : `${points.length} medidas registradas, de ${formatValue(first.value)} em ${formatShortDate(
          first.occurredAt,
        )} a ${formatValue(last.value)} em ${formatShortDate(last.occurredAt)}.`

  return (
    <figure className={styles.figure} aria-describedby={descId}>
      <figcaption className={styles.caption}>
        <span className={styles.title}>{title}</span>
        <span className={styles.last}>
          {formatValue(last.value)}
          <span className={styles.lastDate}> em {formatShortDate(last.occurredAt)}</span>
        </span>
      </figcaption>

      {points.length > 1 && (
        <div className={styles.plot} aria-hidden="true">
          <svg
            className={styles.svg}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            focusable="false"
          >
            <path className={styles.line} d={path} vectorEffect="non-scaling-stroke" />
          </svg>
          {coords.map(({ point, x, y }, index) => (
            <span
              key={point.id}
              className={[styles.dot, index === coords.length - 1 && styles.dotLast]
                .filter(Boolean)
                .join(' ')}
              style={{ '--x': `${x}%`, '--y': `${(y / VIEW_H) * 100}%` } as CSSProperties}
              title={`${formatShortDate(point.occurredAt)}: ${formatValue(point.value)}`}
            />
          ))}
        </div>
      )}

      {points.length > 1 && (
        <p className={styles.range} aria-hidden="true">
          <span>
            {formatValue(first.value)} em {formatShortDate(first.occurredAt)}
          </span>
          <span>{points.length} medidas</span>
        </p>
      )}

      <p id={descId} className={a11y.srOnly}>
        {description}
      </p>
    </figure>
  )
}
