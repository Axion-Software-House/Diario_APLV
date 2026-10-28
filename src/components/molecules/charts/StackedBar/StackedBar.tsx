import { useId } from 'react'
import { countLabel, RECORD_UNIT } from '../format'
import type { CountUnit } from '../format'
import a11y from '../srOnly.module.css'
import styles from './StackedBar.module.css'

/** Cor fixa por entidade (tokens `--chart-*`): a mesma opção, sempre a mesma cor. */
export type StackedBarTone = 'chart1' | 'chart2' | 'chart3' | 'chart4' | 'neutral' | 'neutralSoft'

export type StackedBarPart = {
  key: string
  label: string
  value: number
  tone: StackedBarTone
}

type Props = {
  /** Título visível, ex.: "Leite ou derivados, últimos 7 dias". */
  title: string
  parts: readonly StackedBarPart[]
  unit?: CountUnit
}

const HEIGHT = 16
const RADIUS = 4
/** Vão na cor da superfície entre as partes. */
const GAP = 2

/**
 * Partes de um todo de UM tipo de registro, numa barra só. A legenda abaixo
 * traz cada opção com o número — é ela que identifica as partes (nunca a cor
 * sozinha) e é ela que o leitor de tela lê; a barra é decorativa.
 */
export function StackedBar({ title, parts, unit = RECORD_UNIT }: Props) {
  const clipId = useId()
  const total = parts.reduce((sum, part) => sum + part.value, 0)

  // Início de cada parte = soma das anteriores, em % do todo.
  const segments = parts
    .filter((part) => part.value > 0)
    .map((part, index, visible) => ({
      ...part,
      start: (visible.slice(0, index).reduce((sum, item) => sum + item.value, 0) / total) * 100,
      width: (part.value / total) * 100,
    }))

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>
        {title}
        <span className={styles.total}> — {countLabel(total, unit)}</span>
      </figcaption>
      {total > 0 && (
        <svg
          className={styles.chart}
          width="100%"
          height={HEIGHT}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width="100%" height={HEIGHT} rx={RADIUS} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            {segments.map((segment) => (
              <rect
                key={segment.key}
                className={styles[segment.tone]}
                x={`${segment.start}%`}
                y="0"
                width={`${segment.width}%`}
                height={HEIGHT}
              >
                <title>{`${segment.label}: ${countLabel(segment.value, unit)}`}</title>
              </rect>
            ))}
            {/* O vão entre as partes, na cor da superfície — nunca uma borda. */}
            {segments.slice(1).map((segment) => (
              <rect
                key={`gap-${segment.key}`}
                className={styles.gap}
                x={`${segment.start}%`}
                y="0"
                width={GAP}
                height={HEIGHT}
                transform={`translate(${-GAP / 2} 0)`}
              />
            ))}
          </g>
        </svg>
      )}
      <ul className={styles.legend}>
        {parts.map((part) => (
          <li key={part.key} className={styles.legendItem}>
            <span className={[styles.swatch, styles[part.tone]].join(' ')} aria-hidden="true" />
            <span className={styles.legendLabel}>{part.label}</span>
            <span className={styles.legendValue}>
              {part.value}
              <span className={a11y.srOnly}>
                {part.value === 1 ? ` ${unit.one}` : ` ${unit.many}`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
