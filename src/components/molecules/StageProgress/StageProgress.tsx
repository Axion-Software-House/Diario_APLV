import styles from './StageProgress.module.css'

type Props = {
  current: number
  total: number
  label: string
  dayOfStage?: number
}

/**
 * Onde a família está na escada. Mostra posição — nunca sugere avançar,
 * repetir ou parar. Essa decisão é da equipe assistente.
 */
export function StageProgress({ current, total, label, dayOfStage }: Props) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.stage}>
        <span className={styles.counter}>
          Etapa {current} de {total}
        </span>
        <span className={styles.label}>{label}</span>
      </p>
      {dayOfStage !== undefined && <p className={styles.day}>Dia {dayOfStage} desta etapa</p>}
      <div
        className={styles.track}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`Etapa ${current} de ${total}: ${label}`}
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={[styles.step, index < current && styles.reached].filter(Boolean).join(' ')}
          />
        ))}
      </div>
    </div>
  )
}
