import { Navigate, useNavigate } from 'react-router-dom'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Card } from '@/components/molecules/Card'
import { StageProgress } from '@/components/molecules/StageProgress'
import { StageActions } from '@/components/organisms/StageActions'
import { StageHistoryList } from '@/components/organisms/StageHistoryList'
import { useChangeStage } from '@/hooks/useChangeStage'
import { useChild } from '@/hooks/useChild'
import { useStageHistory } from '@/hooks/useStageHistory'
import { useTpoStages, stageLabelFrom } from '@/hooks/useTpoStages'
import { dayOfStage } from '@/utils/dates'
import type { StageOutcome } from '@/types'
import styles from './Stages.module.css'

export default function Stages() {
  const navigate = useNavigate()
  const { activeTpo } = useChild()
  const { stages } = useTpoStages()
  const periods = useStageHistory()
  const { state, errorMessage, submit } = useChangeStage()

  // Sem TPO em andamento não há etapa para mudar.
  if (!activeTpo) return <Navigate to="/app" replace />

  const { protocol, currentStagePeriod } = activeTpo
  const labelFor = (ordinal: number) => stageLabelFrom(stages, ordinal)

  async function handleConfirm(outcome: StageOutcome, note: string | null) {
    const ok = await submit({ outcome, note })
    if (ok)
      navigate('/app/tpo', { replace: true, state: { flash: 'Mudança de etapa registrada.' } })
  }

  return (
    <AppTemplate title="Etapas" subtitle="Onde o TPO está." backTo="/app/tpo">
      <Card as="section" className={styles.current} aria-label="Etapa atual">
        <StageProgress
          current={protocol.current_stage}
          total={stages.length}
          label={labelFor(protocol.current_stage)}
          dayOfStage={currentStagePeriod ? dayOfStage(currentStagePeriod.started_at) : undefined}
        />
      </Card>

      <StageActions
        current={protocol.current_stage}
        state={state}
        errorMessage={errorMessage}
        total={stages.length}
        labelFor={labelFor}
        onConfirm={(outcome, note) => void handleConfirm(outcome, note)}
      />

      {periods.length > 0 && (
        <section className={styles.history} aria-label="Histórico de etapas">
          <h2 className={styles.historyTitle}>Histórico</h2>
          <StageHistoryList periods={periods} labelFor={labelFor} />
        </section>
      )}
    </AppTemplate>
  )
}
