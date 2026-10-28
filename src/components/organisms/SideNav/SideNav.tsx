import { Link, NavLink, useLocation } from 'react-router-dom'
import { Plus, User } from 'lucide-react'
import { BrandMark } from '@/components/atoms/BrandIllustration'
import { Button } from '@/components/atoms/Button'
import { EmojiBadge } from '@/components/atoms/EmojiBadge'
import { NAV_TABS } from '@/constants/navigation'
import type { NavTab } from '@/constants/navigation'
import styles from './SideNav.module.css'

type Props = {
  /** Abre a folha "+ Novo registro" (o AppTemplate é dono dela). */
  onNewRecord: () => void
}

function isActive(tab: NavTab, pathname: string): boolean {
  if (tab.to === '/app') return pathname === '/app'
  return pathname.startsWith(tab.match ?? tab.to)
}

/**
 * Navegação do desktop (≥1024px): as mesmas quatro áreas da barra inferior,
 * a marca e o "+ Novo registro" sempre à mão. Abaixo de 1024px some por CSS
 * (`display: none` tira do leitor de tela também) e a BottomNav assume.
 */
export function SideNav({ onNewRecord }: Props) {
  const { pathname } = useLocation()

  return (
    <nav className={styles.side} aria-label="Navegação principal" data-print="hide">
      <Link to="/app" className={styles.brand}>
        <BrandMark className={styles.mark} />
        <span>Diário APLV</span>
      </Link>

      <Button className={styles.newRecord} onClick={onNewRecord}>
        <Plus size={18} aria-hidden="true" />
        Novo registro
      </Button>

      <ul className={styles.list}>
        {NAV_TABS.map((tab) => {
          const active = isActive(tab, pathname)
          return (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.to === '/app'}
                className={[styles.link, active && styles.active].filter(Boolean).join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                <EmojiBadge emoji={tab.emoji} size="md" />
                <span>{tab.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>

      <NavLink
        to="/app/perfil"
        className={[styles.link, styles.profile, pathname === '/app/perfil' && styles.active]
          .filter(Boolean)
          .join(' ')}
        aria-current={pathname === '/app/perfil' ? 'page' : undefined}
      >
        <span className={styles.profileIcon} aria-hidden="true">
          <User size={20} />
        </span>
        <span>Perfil</span>
      </NavLink>
    </nav>
  )
}
