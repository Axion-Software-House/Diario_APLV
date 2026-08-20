import { Alert } from '@/components/molecules/Alert'
import { ALARM_MESSAGE } from '@/constants/symptoms'
import styles from './SafetyAlert.module.css'

type Props = {
  /** Sinais marcados que pedem avaliação — só os rótulos, sem juízo. */
  signs: readonly string[]
}

/**
 * Orientação de cuidado quando um sinal com `alarm: true` é marcado.
 * Não classifica gravidade, não conclui e não indica conduta: pede
 * avaliação do profissional de saúde responsável.
 */
export function SafetyAlert({ signs }: Props) {
  if (signs.length === 0) return null

  return (
    <Alert variant="error">
      {ALARM_MESSAGE}
      <span className={styles.signs}>{signs.join(' · ')}</span>
    </Alert>
  )
}
