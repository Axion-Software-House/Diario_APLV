import styles from './Loading.module.css'

export function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  )
}
