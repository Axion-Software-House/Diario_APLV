import styles from './BrandIllustration.module.css'

type Props = {
  className?: string
}

/**
 * Ilustração da marca nas telas de acesso: um diário aberto com um coração,
 * folhas e uma lua (o app é usado muito de madrugada). Abstrata de propósito:
 * sem bebê, sem mamadeira e sem nada que pareça orientação de saúde.
 *
 * Decorativa: `aria-hidden`, o texto ao lado dá o sentido. As cores vêm dos
 * tokens de marca (classes do CSS module), nenhum valor cru no SVG.
 */
export function BrandIllustration({ className }: Props) {
  return (
    <svg
      className={[styles.svg, className].filter(Boolean).join(' ')}
      viewBox="0 0 360 300"
      aria-hidden="true"
      focusable="false"
    >
      {/* Halo e formas orgânicas atrás do diário */}
      <path
        className={styles.halo}
        d="M58 166c-6-66 50-124 126-128 74-4 128 42 134 104 6 66-44 122-122 128-78 6-132-38-138-104z"
      />
      <path
        className={styles.blobBlush}
        d="M246 70c26-12 58-2 70 24 12 26 0 54-26 64-26 10-54-2-64-28-10-24-4-48 20-60z"
      />
      <path
        className={styles.blobLilac}
        d="M64 96c14-24 44-30 66-16 22 14 26 44 10 64-16 20-46 22-64 6-16-14-24-36-12-54z"
      />

      {/* Lua e brilhos */}
      <path className={styles.moon} d="M300 30a22 22 0 1 0 22 30 17 17 0 1 1-22-30z" />
      <g className={styles.twinkle}>
        <path className={styles.sparkle} d="M70 52l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path className={styles.sparkle} d="M330 128l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      </g>
      <circle className={styles.dot} cx="44" cy="190" r="4" />
      <circle className={styles.dot} cx="318" cy="214" r="5" />
      <circle className={styles.dotSoft} cx="262" cy="34" r="3" />

      <g className={styles.float}>
        {/* Ramo da esquerda */}
        <path className={styles.stem} d="M104 236c-14-22-22-48-24-80" />
        <path className={styles.leaf} d="M80 160c-20-4-30-22-26-42 18 6 30 22 26 42z" />
        <path className={styles.leafDeep} d="M86 196c-18 6-36-2-42-20 20-4 36 4 42 20z" />
        <path className={styles.leaf} d="M94 222c-16 10-34 6-44-8 18-8 34-4 44 8z" />

        {/* Ramo da direita */}
        <path className={styles.stem} d="M266 238c18-18 30-42 34-72" />
        <path className={styles.leafDeep} d="M300 168c16-12 20-32 10-48-14 12-18 30-10 48z" />
        <path className={styles.leaf} d="M290 202c20 0 34-14 36-32-20 0-34 12-36 32z" />

        {/* Sombra suave do diário */}
        <ellipse className={styles.shadow} cx="182" cy="262" rx="104" ry="10" />

        {/* Capa */}
        <path
          className={styles.cover}
          d="M82 124c34-6 72-2 100 16 28-18 66-22 100-16v126c-34-6-72-2-100 16-28-18-66-22-100-16z"
        />
        {/* Páginas */}
        <path className={styles.page} d="M92 120c30-6 62-2 86 14v118c-24-14-56-18-86-12z" />
        <path className={styles.pageRight} d="M186 134c24-16 56-20 86-14v120c-30-6-62-2-86 12z" />
        <path className={styles.spine} d="M182 136v118" />

        {/* Página da esquerda: registros do dia */}
        <circle className={styles.check} cx="112" cy="150" r="6" />
        <path className={styles.line} d="M124 150h40" />
        <circle className={styles.checkWarm} cx="112" cy="174" r="6" />
        <path className={styles.line} d="M124 174h34" />
        <circle className={styles.check} cx="112" cy="198" r="6" />
        <path className={styles.line} d="M124 198h42" />
        <path className={styles.lineSoft} d="M106 222h56" />

        {/* Página da direita: o coração */}
        <path
          className={styles.heart}
          d="M229 206c-22-13-32-25-32-38 0-10 8-18 18-18 6 0 11 3 14 8 3-5 8-8 14-8 10 0 18 8 18 18 0 13-10 25-32 38z"
        />
        <path className={styles.heartShine} d="M209 166c1-5 5-8 10-8" />
        <path className={styles.lineSoft} d="M204 226h52" />
      </g>
    </svg>
  )
}
