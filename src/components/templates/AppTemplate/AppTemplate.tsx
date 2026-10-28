import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Toast } from '@/components/molecules/Toast'
import { BottomNav } from '@/components/organisms/BottomNav'
import { NewRecordSheet } from '@/components/organisms/NewRecordSheet'
import { SideNav } from '@/components/organisms/SideNav'
import { useFlash } from '@/hooks/useFlash'
import styles from './AppTemplate.module.css'

type Props = {
  title: string
  subtitle?: string
  /** Quando presente, mostra o retorno no topo da tela. */
  backTo?: string
  /** Estado opcional repassado ao Link de retorno (ex.: preservar `from`). */
  backState?: unknown
  headerAside?: ReactNode
  /** Telas de nível 1 (Início, Diário, TPO, Aprender) mostram a barra inferior. */
  bottomNav?: boolean
  /**
   * Barra lateral do desktop (≥1024px). Ligada em toda tela do app; o Admin
   * desliga, porque o superusuário pode não ter criança cadastrada.
   */
  sideNav?: boolean
  children: ReactNode
}

export function AppTemplate({
  title,
  subtitle,
  backTo,
  backState,
  headerAside,
  bottomNav = false,
  sideNav = true,
  children,
}: Props) {
  const flash = useFlash()
  const [dismissed, setDismissed] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div
      className={[
        styles.shell,
        bottomNav ? styles.withBottomNav : styles.withoutBottomNav,
        sideNav && styles.withSideNav,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {sideNav && <SideNav onNewRecord={() => setSheetOpen(true)} />}

      <div className={styles.frame}>
        <header className={[styles.header, backTo && styles.hasBack].filter(Boolean).join(' ')}>
          {backTo && (
            <Link to={backTo} state={backState} className={styles.back}>
              <ArrowLeft size={20} aria-hidden="true" />
              Voltar
            </Link>
          )}
          <div className={styles.titles}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {headerAside && <div className={styles.aside}>{headerAside}</div>}
        </header>
        <main className={styles.main}>{children}</main>
      </div>

      {flash && !dismissed && <Toast message={flash} onDismiss={() => setDismissed(true)} />}
      {bottomNav && <BottomNav />}
      {sideNav && <NewRecordSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />}
    </div>
  )
}
