import { countLabel, RECORD_UNIT } from '../format'
import type { CountUnit } from '../format'
import a11y from '../srOnly.module.css'
import styles from './WeekStrip.module.css'

export type WeekStripDay = {
  key: string
  /** Rótulo curto sob a coluna (dia do mês). */
  dayLabel: string
  /** Rótulo completo, para leitor de tela e dica ao passar o mouse. */
  fullLabel: string
  isToday: boolean
  count: number
}

type Props = {
  /** Título visível do gráfico, ex.: "Fraldas por dia, últimos 7 dias". */
  title: string
  days: readonly WeekStripDay[]
  unit?: CountUnit
}

/** Faixa do número acima da barra. */
const VALUE_BAND = 22
/** Altura máxima da barra. */
const PLOT = 48
/** Faixa do rótulo do dia, abaixo da linha de base. */
const DAY_BAND = 24
const HEIGHT = VALUE_BAND + PLOT + DAY_BAND
const BASELINE = VALUE_BAND + PLOT
/** Raio da ponta da barra (a base fica reta). */
const RADIUS = 4

/**
 * Faixa dos últimos dias com a quantidade de registros de UM tipo por dia —
 * a "semana" de fraldas, de alimentação etc. Uma série só, uma cor só.
 *
 * O SVG não usa `viewBox`: as colunas são posicionadas em porcentagem e as
 * medidas verticais em px, então o texto fica sempre com 14px e a faixa
 * ocupa a largura disponível sem rolagem horizontal (320px inclusive). Para
 * o leitor de tela o desenho é decorativo; ele lê a lista equivalente.
 */
export function WeekStrip({ title, days, unit = RECORD_UNIT }: Props) {
  const max = Math.max(1, ...days.map((day) => day.count))
  const columns = days.length
  // Com 14 colunas no celular, cada uma tem ~18px: barra mais fina e rótulo
  // do dia em dias alternados (sempre incluindo hoje).
  const barWidth = columns > 7 ? 10 : 20
  const labelEvery = columns > 7 ? 2 : 1
  const half = -barWidth / 2

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>{title}</figcaption>
      <svg
        className={styles.chart}
        width="100%"
        height={HEIGHT}
        aria-hidden="true"
        focusable="false"
      >
        <line className={styles.baseline} x1="0" x2="100%" y1={BASELINE} y2={BASELINE} />
        {days.map((day, index) => {
          const height = day.count > 0 ? Math.max(RADIUS * 2, (day.count / max) * PLOT) : 0
          const showDay = (columns - 1 - index) % labelEvery === 0
          return (
            <svg
              key={day.key}
              x={`${(index / columns) * 100}%`}
              width={`${100 / columns}%`}
              height={HEIGHT}
              overflow="visible"
            >
              <title>{`${day.fullLabel}: ${countLabel(day.count, unit)}`}</title>
              {/* Alvo do mouse: a coluna inteira, não só a barra. */}
              <rect className={styles.hit} x="0" y="0" width="100%" height={BASELINE} />
              {height > 0 ? (
                <>
                  <rect
                    className={styles.bar}
                    x="50%"
                    y={BASELINE - height}
                    width={barWidth}
                    height={height}
                    rx={RADIUS}
                    transform={`translate(${half} 0)`}
                  />
                  {/* Base reta: cobre o arredondamento de baixo. */}
                  <rect
                    className={styles.bar}
                    x="50%"
                    y={BASELINE - RADIUS}
                    width={barWidth}
                    height={RADIUS}
                    transform={`translate(${half} 0)`}
                  />
                  <text
                    className={styles.value}
                    x="50%"
                    y={BASELINE - height - 6}
                    textAnchor="middle"
                  >
                    {day.count}
                  </text>
                </>
              ) : (
                <rect
                  className={styles.zero}
                  x="50%"
                  y={BASELINE - 2}
                  width={barWidth}
                  height="2"
                  transform={`translate(${half} 0)`}
                />
              )}
              {showDay && (
                <text
                  className={day.isToday ? styles.today : styles.day}
                  x="50%"
                  y={HEIGHT - 5}
                  textAnchor="middle"
                >
                  {day.dayLabel}
                </text>
              )}
            </svg>
          )
        })}
      </svg>
      <p className={styles.legend} aria-hidden="true">
        Embaixo, o dia do mês; em negrito, hoje.
      </p>
      <ul className={a11y.srOnly}>
        {days.map((day) => (
          <li key={day.key}>
            {`${day.isToday ? 'Hoje, ' : ''}${day.fullLabel}: ${countLabel(day.count, unit)}`}
          </li>
        ))}
      </ul>
    </figure>
  )
}
