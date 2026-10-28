import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Toast } from '@/components/molecules/Toast'
import { BottomNav } from '@/components/organisms/BottomNav'
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
  children: ReactNode
}

export function AppTemplate({
  title,
  subtitle,
  backTo,
  backState,
  headerAside,
  bottomNav = false,
  children,
}: Props) {
  const flash = useFlash()
  const [dismissed, setDismissed] = useState(false)

  return (
    <div
      className={[styles.shell, bottomNav ? styles.withBottomNav : styles.withoutBottomNav].join(
        ' ',
      )}
    >
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {backTo && (
            <Link to={backTo} state={backState} className={styles.back}>
              <ArrowLeft size={18} aria-hidden="true" />
              Voltar
            </Link>
          )}
          <div className={styles.titles}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {headerAside && <div className={styles.aside}>{headerAside}</div>}
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      {flash && !dismissed && <Toast message={flash} onDismiss={() => setDismissed(true)} />}
      {bottomNav && <BottomNav />}
    </div>
  )
}
