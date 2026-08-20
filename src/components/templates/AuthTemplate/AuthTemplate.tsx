import type { ReactNode } from 'react'
import styles from './AuthTemplate.module.css'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthTemplate({ title, subtitle, children, footer }: Props) {
  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <header className={styles.header}>
          <p className={styles.brand}>Diário APLV</p>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>
        {children}
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </section>
    </main>
  )
}
