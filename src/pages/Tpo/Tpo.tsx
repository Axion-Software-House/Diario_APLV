import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ShieldCheck, Stethoscope, Utensils } from 'lucide-react'
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
import { useTimeline } from '@/hooks/useTimeline'
import { useTpoStages, stageLabelFrom } from '@/hooks/useTpoStages'
import { TPO_INTRO, TPO_SEQUENCE_NOTE, TPO_TEAM_MESSAGE } from '@/constants/stages'
import { dayOfStage } from '@/utils/dates'
import styles from './Tpo.module.css'

const QUICK_ACTIONS = [
  { to: '/app/alimentacao', label: 'Registrar alimentação', icon: Utensils },
  { to: '/app/sintomas', label: 'Registrar sintoma', icon: Stethoscope },
  { to: '/app/tudo-tranquilo', label: 'Tudo tranquilo', icon: ShieldCheck },
]

export default function Tpo() {
  const { activeTpo } = useChild()
  const { stages } = useTpoStages()
  const periods = useStageHistory()
  const { events } = useTimeline()
  const { state, errorMessage, submit } = useStartTpo()
  const [confirming, setConfirming] = useState(false)

  const current = activeTpo?.protocol.current_stage ?? 0
  const stage = stages.find((item) => item.ordinal === current)

  const counts = useMemo(() => {
    const inStage = events.filter((event) => event.stage === current)
    return {
      exposures: inStage.filter((e) => e.kind === 'exposure').length,
      symptoms: inStage.filter((e) => e.kind === 'symptom').length,
      calm: inStage.filter((e) => e.kind === 'no_symptoms').length,
    }
  }, [events, current])

  if (activeTpo) {
    const { protocol, currentStagePeriod } = activeTpo

    return (
      <AppTemplate title="TPO" subtitle="A reintrodução em andamento." bottomNav>
        <Card as="section" className={styles.block} aria-label="Etapa atual">
          <StageProgress
            current={protocol.current_stage}
            total={stages.length}
            label={stage?.label ?? stageLabelFrom(stages, protocol.current_stage)}
            dayOfStage={currentStagePeriod ? dayOfStage(currentStagePeriod.started_at) : undefined}
          />

          {stage?.short_explanation && (
            <p className={styles.explanation}>{stage.short_explanation}</p>
          )}

          {stage?.why_this_stage && (
            <details className={styles.why}>
              <summary className={styles.whySummary}>Por que esta etapa?</summary>
              <p className={styles.whyText}>{stage.why_this_stage}</p>
            </details>
          )}

          <dl className={styles.counts}>
            <div>
              <dt>Alimentação</dt>
              <dd>{counts.exposures}</dd>
            </div>
            <div>
              <dt>Sintomas</dt>
              <dd>{counts.symptoms}</dd>
            </div>
            <div>
              <dt>Tudo tranquilo</dt>
              <dd>{counts.calm}</dd>
            </div>
          </dl>

          <Link to="/app/tpo/etapas" className={styles.stageLink}>
            Avançar, repetir ou retornar
          </Link>
        </Card>

        <section className={styles.block} aria-label="Registrar nesta etapa">
          <h2 className={styles.heading}>Registrar</h2>
          <div className={styles.quick}>
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.to} to={action.to} className={styles.quickItem}>
                  <Icon size={18} aria-hidden="true" />
                  {action.label}
                </Link>
              )
            })}
          </div>
        </section>

        {periods.length > 0 && (
          <section className={styles.block} aria-label="Histórico de etapas">
            <h2 className={styles.heading}>Histórico</h2>
            <StageHistoryList
              periods={periods}
              labelFor={(ordinal) => stageLabelFrom(stages, ordinal)}
            />
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
          {stages.map((item) => (
            <li key={item.ordinal}>{item.label}</li>
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

      <p className={styles.footNote}>
        <CalendarClock size={14} aria-hidden="true" /> O TPO só aparece como acompanhamento em
        andamento depois de iniciado.
      </p>
    </AppTemplate>
  )
}
