import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './AppTemplate.module.css'

type Props = {
  title: string
  subtitle?: string
  /** Quando presente, mostra o retorno à Home no topo da tela. */
  backTo?: string
  headerAside?: ReactNode
  children: ReactNode
}

export function AppTemplate({ title, subtitle, backTo, headerAside, children }: Props) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {backTo && (
            <Link to={backTo} className={styles.back}>
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
    </div>
  )
}
