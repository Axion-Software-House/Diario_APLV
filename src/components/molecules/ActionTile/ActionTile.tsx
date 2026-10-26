import { Link, useLocation } from 'react-router-dom'
import { SpotlightCard } from '@/components/animations/SpotlightCard'
import type { LucideIcon } from 'lucide-react'
import styles from './ActionTile.module.css'

type Props = {
  to: string
  label: string
  hint?: string
  icon: LucideIcon
  emphasis?: boolean
  state?: unknown
}

/** Atalho grande da Home: ícone + nome, área de toque generosa. */
export function ActionTile({ to, label, hint, icon: Icon, emphasis = false, state }: Props) {
  const location = useLocation()

  return (
    <SpotlightCard className={styles.spotlight}>
      <Link
        to={to}
        state={state ?? { from: location.pathname }}
        className={[styles.tile, emphasis && styles.emphasis].filter(Boolean).join(' ')}
      >
        <Icon className={styles.icon} size={24} aria-hidden="true" />
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </Link>
    </SpotlightCard>
  )
}
