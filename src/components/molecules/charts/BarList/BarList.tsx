import styles from './BarList.module.css'

export type BarListItem = {
  key: string
  label: string
  value: number
  /** Emoji de `constants` (ex.: rostinho da intensidade). Sempre com o texto ao lado. */
  emoji?: string
}

type Props = {
  /** Título visível da lista, ex.: "Sintomas mais registrados, últimos 7 dias". */
  title: string
  items: readonly BarListItem[]
  /** Texto do valor; por padrão, o número. Ex.: `(v) => \`${v} dias\``. */
  formatValue?: (value: number) => string
  /** Topo da escala. Por padrão, o maior valor da lista. */
  max?: number
}

/** Espessura da barra e raio da ponta. */
const THICKNESS = 8
const RADIUS = 4

/**
 * Lista em barras: rótulo, valor e uma barra proporcional. É uma lista de
 * verdade (`ul`), então rótulo e número chegam ao leitor de tela como texto;
 * a barra é só reforço visual. Rótulo longo quebra linha, nunca é cortado.
 */
export function BarList({ title, items, formatValue = String, max }: Props) {
  const top = Math.max(1, max ?? 0, ...items.map((item) => item.value))

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>{title}</figcaption>
      <ul className={styles.list}>
        {items.map((item) => {
          const width = (item.value / top) * 100
          return (
            <li key={item.key} className={styles.item}>
              <span className={styles.row}>
                <span className={styles.label}>
                  {item.emoji && (
                    <span className={styles.emoji} aria-hidden="true" data-emoji>
                      {item.emoji}
                    </span>
                  )}
                  {item.label}
                </span>
                <span className={styles.value}>{formatValue(item.value)}</span>
              </span>
              <svg
                className={styles.track}
                width="100%"
                height={THICKNESS}
                aria-hidden="true"
                focusable="false"
              >
                {width > 0 && (
                  <>
                    <rect
                      className={styles.bar}
                      x="0"
                      y="0"
                      width={`${width}%`}
                      height={THICKNESS}
                      rx={RADIUS}
                    />
                    {/* Base reta à esquerda; só a ponta do valor é arredondada. */}
                    <rect className={styles.bar} x="0" y="0" width={RADIUS} height={THICKNESS} />
                  </>
                )}
              </svg>
            </li>
          )
        })}
      </ul>
    </figure>
  )
}
