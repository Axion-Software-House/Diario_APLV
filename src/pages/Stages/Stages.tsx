import { useNavigate } from 'react-router-dom'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { StageProgress } from '@/components/molecules/StageProgress'
import { StageActions } from '@/components/organisms/StageActions'
import { StageHistoryList } from '@/components/organisms/StageHistoryList'
import { STAGES, stageLabel } from '@/constants/stages'
import { useChangeStage } from '@/hooks/useChangeStage'
import { useProtocol } from '@/hooks/useProtocol'
import { useStageHistory } from '@/hooks/useStageHistory'
import { dayOfStage } from '@/utils/dates'
import type { StageOutcome } from '@/types'
import styles from './Stages.module.css'

export default function Stages() {
  const navigate = useNavigate()
  const { active } = useProtocol()
  const periods = useStageHistory()
  const { state, errorMessage, submit } = useChangeStage()

  // RequireProtocol garante que existe; a guarda é só para o tipo.
  if (!active) return null

  const { protocol, currentStagePeriod } = active

  async function handleConfirm(outcome: StageOutcome, note: string | null) {
    const ok = await submit({ outcome, note })
    if (ok) navigate('/app', { replace: true, state: { flash: 'Mudança de etapa registrada.' } })
  }

  return (
    <AppTemplate title="Etapas" subtitle="Onde o acompanhamento está." backTo="/app">
      <section className={styles.current} aria-label="Etapa atual">
        <StageProgress
          current={protocol.current_stage}
          total={STAGES.length}
          label={stageLabel(protocol.current_stage)}
          dayOfStage={currentStagePeriod ? dayOfStage(currentStagePeriod.started_at) : undefined}
        />
      </section>

      <StageActions
        current={protocol.current_stage}
        state={state}
        errorMessage={errorMessage}
        onConfirm={(outcome, note) => void handleConfirm(outcome, note)}
      />

      {periods.length > 0 && (
        <section className={styles.history} aria-label="Histórico de etapas">
          <h2 className={styles.historyTitle}>Histórico</h2>
          <StageHistoryList periods={periods} />
        </section>
      )}
    </AppTemplate>
  )
}
