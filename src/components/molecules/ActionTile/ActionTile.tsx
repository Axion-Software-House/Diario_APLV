import { Link, useLocation } from 'react-router-dom'
import { SpotlightCard } from '@/components/animations/SpotlightCard'
import type { LucideIcon } from 'lucide-react'
import styles from './ActionTile.module.css'

type Props = {
  to: string
  label: string
  hint?: string
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
          <span className={styles.emoji} aria-hidden="true" data-emoji>
            {emoji}
          </span>
        ) : Icon ? (
          <Icon className={styles.icon} size={24} aria-hidden="true" />
        ) : null}
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </Link>
    </SpotlightCard>
  )
}
