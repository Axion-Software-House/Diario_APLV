import styles from './BrandMark.module.css'

type Props = {
  /** `brand`: violeta com barras brancas (fundo claro). `light`: o inverso, para o gradiente. */
  tone?: 'brand' | 'light'
  className?: string
}

/**
 * O símbolo do app (o mesmo desenho do favicon), em SVG inline para herdar
 * os tokens. Decorativo: o nome "Diário APLV" vem sempre em texto ao lado.
 */
export function BrandMark({ tone = 'brand', className }: Props) {
  return (
    <svg
      className={[styles.mark, styles[tone], className].filter(Boolean).join(' ')}
      viewBox="0 0 512 512"
      aria-hidden="true"
      focusable="false"
    >
      <rect className={styles.tile} width="512" height="512" rx="113" />
      <g className={styles.bars}>
        <rect x="98" y="333" width="48" height="64" rx="15" />
        <rect x="163" y="269" width="48" height="128" rx="15" />
        <rect x="228" y="206" width="48" height="191" rx="15" />
        <rect x="294" y="142" width="48" height="255" rx="15" />
        <rect x="359" y="79" width="48" height="318" rx="15" />
      </g>
    </svg>
  )
}
