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

          return (
            <li key={tab.to} className={styles.item}>
              <NavLink
                to={tab.to}
                end={tab.to === '/app'}
                className={[styles.link, active && styles.active].filter(Boolean).join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                <span className={styles.emoji} aria-hidden="true">
                  {tab.emoji}
                </span>
                <span className={styles.label}>{tab.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
