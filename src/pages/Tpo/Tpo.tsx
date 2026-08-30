import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Alert } from '@/components/molecules/Alert'
import { StageProgress } from '@/components/molecules/StageProgress'
import { StageHistoryList } from '@/components/organisms/StageHistoryList'
import { Modal } from '@/components/organisms/Modal'
import { useChild } from '@/hooks/useChild'
import { useStageHistory } from '@/hooks/useStageHistory'
import { useStartTpo } from '@/hooks/useStartTpo'
import {
  STAGES,
  TPO_INTRO,
  TPO_SEQUENCE_NOTE,
  TPO_TEAM_MESSAGE,
  stageLabel,
} from '@/constants/stages'
import { dayOfStage } from '@/utils/dates'
import styles from './Tpo.module.css'

export default function Tpo() {
  const { activeTpo } = useChild()
  const periods = useStageHistory()
  const { state, errorMessage, submit } = useStartTpo()
  const [confirming, setConfirming] = useState(false)

  if (activeTpo) {
    const { protocol, currentStagePeriod } = activeTpo

    return (
      <AppTemplate title="TPO" subtitle="A reintrodução em andamento." bottomNav>
        <Card as="section" className={styles.block} aria-label="Etapa atual">
          <StageProgress
            current={protocol.current_stage}
            total={STAGES.length}
            label={stageLabel(protocol.current_stage)}
            dayOfStage={currentStagePeriod ? dayOfStage(currentStagePeriod.started_at) : undefined}
          />
          <Link to="/app/tpo/etapas" className={styles.stageLink}>
            Avançar, repetir ou retornar
          </Link>
        </Card>

        {periods.length > 0 && (
          <section className={styles.block} aria-label="Histórico de etapas">
            <h2 className={styles.heading}>Histórico</h2>
            <StageHistoryList periods={periods} />
          </section>
        )}
      </AppTemplate>
    )
  }

  return (
    <AppTemplate title="TPO" subtitle="Teste de Provocação Oral." bottomNav>
      <Card as="section" className={styles.block}>
        <p className={styles.intro}>{TPO_INTRO}</p>
        <Alert variant="info">{TPO_TEAM_MESSAGE}</Alert>
      </Card>

      <Card as="section" className={styles.block} aria-label="Sequência de referência">
        <h2 className={styles.heading}>Sequência de referência</h2>
        <ol className={styles.sequence}>
          {STAGES.map((stage) => (
            <li key={stage.id}>{stage.label}</li>
          ))}
        </ol>
        <p className={styles.note}>{TPO_SEQUENCE_NOTE}</p>
      </Card>

      <Button onClick={() => setConfirming(true)}>Iniciar um TPO</Button>

      <Modal open={confirming} title="Iniciar um TPO?" onClose={() => setConfirming(false)}>
        <div className={styles.confirm}>
          <Alert variant="info">{TPO_TEAM_MESSAGE}</Alert>
          {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
          <div className={styles.confirmButtons}>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              busy={state === 'saving'}
              busyLabel="Iniciando..."
              onClick={() => void submit()}
            >
              Iniciar
            </Button>
          </div>
        </div>
      </Modal>
    </AppTemplate>
  )
}
