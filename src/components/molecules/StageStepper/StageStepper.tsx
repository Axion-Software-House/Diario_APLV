import type { CSSProperties } from 'react'
import type { TpoStep, TpoStepStatus } from '@/utils/typeSummary'
import styles from './StageStepper.module.css'

type Props = {
  steps: readonly TpoStep[]
  /**
   * `compact`: só a linha dos marcadores, sempre horizontal (cartão da Home).
   * Nome e situação de cada etapa continuam no texto para leitor de tela.
   */
  variant?: 'full' | 'compact'
}

/**
 * Texto de cada situação. Descreve o caminho feito, nunca julga a etapa
 * (o resultado de uma etapa é leitura da equipe assistente, não do app).
 */
const STATUS_LABELS: Record<TpoStepStatus, string> = {
  visited: 'Percorrida',
  current: 'Etapa em curso',
  upcoming: 'A seguir',
  skipped: 'Não percorrida',
}

/**
 * Linha do tempo das etapas do TPO: percorridas, a em curso e as próximas.
 * Horizontal quando cabe; num cartão estreito (celular) vira vertical, para
 * o nome da etapa caber em 14px sem rolagem horizontal. A situação está
 * sempre escrita ao lado — a cor só reforça.
 */
export function StageStepper({ steps, variant = 'full' }: Props) {
  const compact = variant === 'compact'
  return (
    <div className={[styles.container, compact && styles.compact].filter(Boolean).join(' ')}>
      <ol
        className={styles.stepper}
        style={{ '--steps': steps.length } as CSSProperties}
        aria-label="Etapas do TPO"
      >
        {steps.map((step) => (
          <li
            key={step.ordinal}
            className={[styles.step, styles[step.status]].join(' ')}
            aria-current={step.status === 'current' ? 'step' : undefined}
          >
            <span className={styles.marker} aria-hidden="true">
              {step.ordinal}
            </span>
            <span className={compact ? styles.srOnly : styles.text}>
              <span className={styles.label}>
                <span className={styles.srOnly}>Etapa {step.ordinal}: </span>
                {step.label}
              </span>
              {compact ? ', ' : null}
              <span className={styles.status}>{STATUS_LABELS[step.status]}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
