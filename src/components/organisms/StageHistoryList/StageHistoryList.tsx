import { Badge } from '@/components/atoms/Badge'
import { Card } from '@/components/molecules/Card'
import { OUTCOME_LABELS } from '@/constants/stages'
import { formatDate, dayOfStage } from '@/utils/dates'
import { isResumedPeriod, previousInProtocol } from '@/utils/timeline'
import type { StageHistory } from '@/types'
import styles from './StageHistoryList.module.css'

type Props = {
  periods: readonly StageHistory[]
  /**
   * Rótulo de uma etapa — de `tpo_stages`, via `useTpoStages`. Obrigatório de
   * propósito: um default mostraria o nome antigo de uma etapa renomeada no
   * banco, que é justamente o que a F4 quis permitir.
   */
  labelFor: (ordinal: number) => string
}

/**
 * O que já foi vivido, na ordem em que aconteceu. Períodos fechados mostram
 * como terminaram; nenhum deles é apagado ou reescrito por uma mudança nova.
 * O período aberto depois de uma pausa aparece como retomada: as datas são
 * as dele, então os dias da pausa não entram em período nenhum.
 */
export function StageHistoryList({ periods, labelFor }: Props) {
  const previousById = previousInProtocol(periods)

  return (
    <ol className={styles.list}>
      {periods.map((period) => {
        const resumed = isResumedPeriod(period, previousById.get(period.id))
        return (
          <Card as="li" key={period.id} className={styles.period} active={!period.ended_at}>
            <p className={styles.stage}>
              Etapa {period.stage} — {labelFor(period.stage)}
            </p>
            <p className={styles.dates}>
              {resumed ? 'Retomado em ' : ''}
              {formatDate(period.started_at)}
              {period.ended_at
                ? ` → ${formatDate(period.ended_at)}`
                : ` · em curso, dia ${dayOfStage(period.started_at)}`}
            </p>
            {period.start_note && (
              <p className={styles.note}>
                {resumed ? 'Observação da retomada' : 'Observação do início'}: {period.start_note}
              </p>
            )}
            {period.outcome && (
              <p className={styles.outcome}>
                <Badge tone="primary">{OUTCOME_LABELS[period.outcome] ?? period.outcome}</Badge>
              </p>
            )}
            {period.note && <p className={styles.note}>{period.note}</p>}
          </Card>
        )
      })}
    </ol>
  )
}
