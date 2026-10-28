import { Link } from 'react-router-dom'
import { AreaEmoji } from '@/components/molecules/AreaEmoji'
import type { Area } from '@/components/molecules/AreaEmoji'
import { formatSince } from '@/utils/dashboard'
import styles from './HomeTile.module.css'

type Props = {
  to: string
  label: string
  hint: string
  area: Area
  emphasis?: boolean
  /** Atalho largo de uma linha ("Tudo tranquilo por aqui?"). */
  wide?: boolean
  /**
   * Último registro desta área: ISO, `null` = nenhum ainda, `undefined` =
   * diário ainda não lido (ou a leitura falhou) — aí a linha não aparece,
   * para nunca afirmar "Nenhum ainda" sem saber.
   */
  latest?: string | null
  reference: Date
}

/**
 * Atalho de registro da Home: 1 toque abre o formulário. Além do nome e da
 * dica, mostra há quanto tempo foi o último registro da área — contexto
 * rápido, sem nenhuma leitura sobre ele.
 */
export function HomeTile({ to, label, hint, area, emphasis, wide, latest, reference }: Props) {
  const since = latest ? formatSince(latest, reference) : null
  const latestText =
    latest === undefined
      ? null
      : latest === null
        ? 'Nenhum ainda'
        : since
          ? `Último: ${since}`
          : null

  return (
    <Link
      to={to}
      state={{ from: '/app' }}
      className={[styles.tile, emphasis && styles.emphasis, wide && styles.wide, styles[area]]
        .filter(Boolean)
        .join(' ')}
    >
      <AreaEmoji area={area} size="lg" className={styles.emoji} />
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span className={styles.hint}>{hint}</span>
        {latestText && <span className={styles.latest}>{latestText}</span>}
      </span>
    </Link>
  )
}
