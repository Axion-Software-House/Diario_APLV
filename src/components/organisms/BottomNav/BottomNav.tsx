import { NavLink, useLocation } from 'react-router-dom'
import { NAV_TABS } from '@/constants/navigation'
import styles from './BottomNav.module.css'

/** Barra de navegação das quatro áreas (README FINAL §3). */
export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className={styles.bar} aria-label="Navegação principal">
      <ul className={styles.list}>
        {NAV_TABS.map((tab) => {
          const base = tab.match ?? tab.to
          const active = tab.to === '/app' ? pathname === '/app' : pathname.startsWith(base)
          const Icon = tab.icon

          return (
            <li key={tab.to} className={styles.item}>
              <NavLink
                to={tab.to}
                end={tab.to === '/app'}
                className={[styles.link, active && styles.active].filter(Boolean).join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={22} aria-hidden="true" />
                <span className={styles.label}>{tab.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
