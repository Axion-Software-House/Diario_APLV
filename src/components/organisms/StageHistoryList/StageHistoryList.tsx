import { OUTCOME_LABELS, stageLabel } from '@/constants/stages'
import { formatDate, dayOfStage } from '@/utils/dates'
import type { StageHistory } from '@/types'
import styles from './StageHistoryList.module.css'

type Props = { periods: readonly StageHistory[] }

/**
 * O que já foi vivido, na ordem em que aconteceu. Períodos fechados mostram
 * como terminaram; nenhum deles é apagado ou reescrito por uma mudança nova.
 */
export function StageHistoryList({ periods }: Props) {
  return (
    <ol className={styles.list}>
      {periods.map((period) => (
        <li key={period.id} className={styles.period}>
          <p className={styles.stage}>
            Etapa {period.stage} — {stageLabel(period.stage)}
          </p>
          <p className={styles.dates}>
            {formatDate(period.started_at)}
            {period.ended_at
              ? ` → ${formatDate(period.ended_at)}`
              : ` · em curso, dia ${dayOfStage(period.started_at)}`}
          </p>
          {period.outcome && (
            <p className={styles.outcome}>{OUTCOME_LABELS[period.outcome] ?? period.outcome}</p>
          )}
          {period.note && <p className={styles.note}>{period.note}</p>}
        </li>
      ))}
    </ol>
  )
}
