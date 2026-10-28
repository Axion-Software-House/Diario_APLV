import { Link, useLocation } from 'react-router-dom'
import { SpotlightCard } from '@/components/animations/SpotlightCard'
import { EmojiBadge } from '@/components/atoms/EmojiBadge'
import type { LucideIcon } from 'lucide-react'
import styles from './ActionTile.module.css'

type Props = {
  to: string
  label: string
  hint?: string
  /** Emoji de `EMOJI`; o círculo ganha o tom da área (`AREA_TONE`). */
  emoji?: string
  icon?: LucideIcon
  emphasis?: boolean
  state?: unknown
}

/** Atalho grande da Home: ícone/emoji + nome, área de toque generosa. */
export function ActionTile({ to, label, hint, emoji, icon: Icon, emphasis = false, state }: Props) {
  const location = useLocation()

  return (
    <SpotlightCard className={styles.spotlight}>
      <Link
        to={to}
        state={state ?? { from: location.pathname }}
        className={[styles.tile, emphasis && styles.emphasis].filter(Boolean).join(' ')}
      >
        {emoji ? (
          <EmojiBadge emoji={emoji} size="lg" />
        ) : Icon ? (
          <span className={styles.icon} aria-hidden="true">
            <Icon size={24} />
          </span>
        ) : null}
        <span className={styles.text}>
          <span className={styles.label}>{label}</span>
          {hint && <span className={styles.hint}>{hint}</span>}
        </span>
      </Link>
    </SpotlightCard>
  )
}
