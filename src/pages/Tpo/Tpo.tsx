import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, FileText } from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Loading } from '@/components/atoms/Loading'
import { Textarea } from '@/components/atoms/Textarea'
import { Toast } from '@/components/molecules/Toast'
import { Card } from '@/components/molecules/Card'
import { Alert } from '@/components/molecules/Alert'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { StageProgress } from '@/components/molecules/StageProgress'
import { StageStepper } from '@/components/molecules/StageStepper'
import { BarList } from '@/components/molecules/charts/BarList'
import { StageHistoryList } from '@/components/organisms/StageHistoryList'
import { Modal } from '@/components/organisms/Modal'
import { useChild } from '@/hooks/useChild'
import { useDiary } from '@/hooks/useDiary'
import { useStageHistory } from '@/hooks/useStageHistory'
import { useEndTpo, useResumeTpo, useStartTpo } from '@/hooks/useStartTpo'
import { useTpoStages, stageLabelFrom } from '@/hooks/useTpoStages'
import {
  TPO_END_ACTIONS,
  TPO_INTRO,
  TPO_SEQUENCE_NOTE,
  TPO_TEAM_MESSAGE,
} from '@/constants/stages'
import type { TpoEndOutcome } from '@/constants/stages'
import { CALM_ACTION, HOME_ACTIONS } from '@/constants/shortcuts'
import {
  dayOfStage,
  formatDate,
  formatDateTime,
  fromDateTimeLocalValue,
  isNotInFuture,
  toDateTimeLocalValue,
} from '@/utils/dates'
import { summarizeTpoJourney } from '@/utils/typeSummary'
import styles from './Tpo.module.css'

/** O emoji de cada atalho sai das mesmas constantes da Home, para as duas telas não divergirem. */
function homeEmoji(to: string): string | undefined {
  return [...HOME_ACTIONS, CALM_ACTION].find((action) => action.to === to)?.emoji
}

const QUICK_ACTIONS = [
  { to: '/app/alimentacao', label: 'Registrar alimentação' },
  { to: '/app/sintomas', label: 'Registrar sintoma' },
  { to: CALM_ACTION.to, label: 'Tudo tranquilo' },
].map((action) => ({ ...action, emoji: homeEmoji(action.to) }))

const END_OUTCOME_CHIPS = TPO_END_ACTIONS.map((item) => ({
  value: item.outcome,
  label: item.label,
}))

const END_FLASH_MESSAGES: Record<TpoEndOutcome, string> = {
  paused: 'TPO pausado.',
  finished: 'TPO encerrado.',
  interrupted: 'TPO interrompido.',
}

export default function Tpo() {
  const { activeTpo, pausedTpo } = useChild()
  const { stages } = useTpoStages()
  const periods = useStageHistory()
  const { sources, loading: diaryLoading, errorMessage: diaryError } = useDiary()
  const { state, errorMessage, submit: submitStart } = useStartTpo()
  const { state: endState, errorMessage: endErrorMessage, submit: submitEnd } = useEndTpo()
  const {
    state: resumeState,
    errorMessage: resumeErrorMessage,
    submit: submitResume,
  } = useResumeTpo()

  const [toastMessage, setToastMessage] = useState<string>()

  const [confirming, setConfirming] = useState(false)
  const [initialStage, setInitialStage] = useState('1')
  const [startAt, setStartAt] = useState(toDateTimeLocalValue())
  const [startNote, setStartNote] = useState('')
  const [startLocalError, setStartLocalError] = useState<string>()

  const [endingModalOpen, setEndingModalOpen] = useState(false)
  const [endOutcome, setEndOutcome] = useState<TpoEndOutcome>('paused')
  const [endAt, setEndAt] = useState(toDateTimeLocalValue())
  const [endNote, setEndNote] = useState('')
  const [endLocalError, setEndLocalError] = useState<string>()

  const [resumeModalOpen, setResumeModalOpen] = useState(false)
  const [resumeAt, setResumeAt] = useState(toDateTimeLocalValue())
  const [resumeNote, setResumeNote] = useState('')
  const [resumeLocalError, setResumeLocalError] = useState<string>()

  const current = activeTpo?.protocol.current_stage ?? 0
  const stage = stages.find((item) => item.ordinal === current)

  const stageChips = useMemo(
    () =>
      stages.map((item) => ({
        value: String(item.ordinal),
        label: `Etapa ${item.ordinal} — ${item.label}`,
      })),
    [stages],
  )

  const protocolId = activeTpo?.protocol.id ?? null
  const periodStartedAt =
    activeTpo?.currentStagePeriod?.started_at ?? activeTpo?.protocol.started_at ?? null

  const counts = useMemo(() => {
    if (!protocolId || !periodStartedAt) {
      return { exposures: 0, symptoms: 0, calm: 0 }
    }
    const startMs = new Date(periodStartedAt).getTime()
    const inCurrentPeriod = (item: {
      protocol_id: string | null
      stage: number | null
      occurred_at: string
    }) =>
      item.protocol_id === protocolId &&
      item.stage === current &&
      new Date(item.occurred_at).getTime() >= startMs

    const stageSymptoms = sources.symptomEvents.filter(inCurrentPeriod)

    return {
      exposures: sources.exposures.filter(inCurrentPeriod).length,
      symptoms: stageSymptoms.filter((event) => !event.no_symptoms).length,
      calm: stageSymptoms.filter((event) => event.no_symptoms).length,
    }
  }, [sources, protocolId, periodStartedAt, current])

  // Percurso do TPO em andamento. Só com o diário carregado: antes disso,
  // "0 dias" seria uma afirmação falsa.
  const journey = useMemo(
    () =>
      protocolId && !diaryLoading && !diaryError
        ? summarizeTpoJourney(sources.stageHistory, protocolId, current, stages)
        : null,
    [sources.stageHistory, protocolId, current, stages, diaryLoading, diaryError],
  )

  function openStartModal() {
    setInitialStage('1')
    setStartAt(toDateTimeLocalValue())
    setStartNote('')
    setStartLocalError(undefined)
    setConfirming(true)
  }

  async function handleStartTpo() {
    if (!startAt || Number.isNaN(new Date(startAt).getTime())) {
      setStartLocalError('Informe a data e a hora de início.')
      return
    }
    if (!isNotInFuture(startAt)) {
      setStartLocalError('A data de início não pode estar no futuro.')
      return
    }
    if (startNote.trim().length > 2000) {
      setStartLocalError('Use no máximo 2000 caracteres na observação.')
      return
    }
    setStartLocalError(undefined)
    const parsedStage = Number(initialStage) || 1
    const ok = await submitStart({
      initialStage: parsedStage,
      startedAt: fromDateTimeLocalValue(startAt),
      note: startNote.trim() || null,
    })
    if (ok) {
      setConfirming(false)
      setToastMessage('TPO iniciado.')
    }
  }

  function openEndModal(defaultOutcome: TpoEndOutcome) {
    setEndOutcome(defaultOutcome)
    setEndAt(toDateTimeLocalValue())
    setEndNote('')
    setEndLocalError(undefined)
    setEndingModalOpen(true)
  }

  async function handleEndTpo() {
    if (!activeTpo) return
    if (!endAt || Number.isNaN(new Date(endAt).getTime())) {
      setEndLocalError('Informe a data e a hora.')
      return
    }
    if (!isNotInFuture(endAt)) {
      setEndLocalError('A data não pode estar no futuro.')
      return
    }
    // O histórico é imutável: um encerramento antes do início da etapa atual
    // ficaria para sempre com o fim antes do começo. Comparação por minuto, a
    // precisão do campo (a mesma regra de `end_tpo`).
    const currentStart = activeTpo.currentStagePeriod?.started_at ?? activeTpo.protocol.started_at
    if (
      new Date(fromDateTimeLocalValue(endAt)).getTime() <
      new Date(fromDateTimeLocalValue(toDateTimeLocalValue(currentStart))).getTime()
    ) {
      setEndLocalError(
        `A data não pode ser anterior ao início da etapa atual (${formatDateTime(currentStart)}).`,
      )
      return
    }
    if (endNote.trim().length > 2000) {
      setEndLocalError('Use no máximo 2000 caracteres na anotação.')
      return
    }
    setEndLocalError(undefined)
    const ok = await submitEnd({
      protocolId: activeTpo.protocol.id,
      outcome: endOutcome,
      endedAt: fromDateTimeLocalValue(endAt),
      note: endNote.trim() || null,
    })
    if (ok) {
      setEndingModalOpen(false)
      setToastMessage(END_FLASH_MESSAGES[endOutcome])
    }
  }

  function openResumeModal() {
    setResumeAt(toDateTimeLocalValue())
    setResumeNote('')
    setResumeLocalError(undefined)
    setResumeModalOpen(true)
  }

  async function handleResumeTpo() {
    if (!pausedTpo) return
    if (!resumeAt || Number.isNaN(new Date(resumeAt).getTime())) {
      setResumeLocalError('Informe a data e a hora.')
      return
    }
    if (!isNotInFuture(resumeAt)) {
      setResumeLocalError('A data não pode estar no futuro.')
      return
    }
    // Mesma regra de `resume_tpo`: a retomada não vem antes da pausa, que
    // ficou registrada no histórico imutável. Comparação por minuto, a
    // precisão do campo.
    const { pausedAt } = pausedTpo
    if (
      new Date(fromDateTimeLocalValue(resumeAt)).getTime() <
      new Date(fromDateTimeLocalValue(toDateTimeLocalValue(pausedAt))).getTime()
    ) {
      setResumeLocalError(
        `A data não pode ser anterior à pausa do TPO (${formatDateTime(pausedAt)}).`,
      )
      return
    }
    if (resumeNote.trim().length > 2000) {
      setResumeLocalError('Use no máximo 2000 caracteres na observação.')
      return
    }
    setResumeLocalError(undefined)
    const ok = await submitResume({
      protocolId: pausedTpo.protocol.id,
      resumedAt: fromDateTimeLocalValue(resumeAt),
      note: resumeNote.trim() || null,
    })
    if (ok) {
      setResumeModalOpen(false)
      setToastMessage('TPO retomado.')
    }
  }

  if (activeTpo) {
    const { protocol, currentStagePeriod } = activeTpo

    return (
      <AppTemplate
        title="TPO"
        subtitle="A reintrodução em andamento."
        bottomNav
        headerAside={
          <Link
            to="/app/relatorio"
            state={{ from: '/app/tpo' }}
            className={styles.reportButton}
            aria-label="Ver relatório para a consulta"
          >
            <FileText size={16} aria-hidden="true" />
            <span>Relatório</span>
          </Link>
        }
      >
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(undefined)} />
      )}

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

          {/* As contagens só aparecem com o diário lido: antes, "0" seria falso. */}
          {diaryLoading && <Loading label="Carregando as contagens..." />}
          {!diaryLoading && diaryError && (
            <Alert variant="error">Não foi possível carregar as contagens agora.</Alert>
          )}
          {!diaryLoading && !diaryError && (
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
          )}

          <Link to="/app/tpo/etapas" className={styles.stageLink}>
            Avançar, repetir ou retornar
          </Link>

          <div className={styles.endActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => openEndModal('paused')}
            >
              Pausar TPO
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => openEndModal('finished')}
            >
              Encerrar TPO
            </Button>
          </div>

          <div className={styles.reportActionRow}>
            <Link
              to="/app/relatorio"
              state={{ from: '/app/tpo' }}
              className={styles.reportBlockLink}
            >
              <FileText size={16} aria-hidden="true" />
              <span>Ver relatório completo do TPO para a consulta →</span>
            </Link>
          </div>
        </Card>

        <Card as="section" className={styles.block} aria-label="Percurso do TPO">
          <h2 className={styles.heading}>Percurso do TPO</h2>
          {diaryLoading && <Loading label="Carregando o percurso..." />}
          {!diaryLoading && diaryError && (
            <Alert variant="error">Não foi possível carregar o percurso agora.</Alert>
          )}
          {journey && (
            <div className={styles.journey}>
              <StageStepper steps={journey.steps} />

              <dl className={styles.totalDays}>
                <dt>Dias de TPO</dt>
                <dd>{journey.totalDays === 1 ? '1 dia' : `${journey.totalDays} dias`}</dd>
              </dl>

              {journey.daysByStage.length > 0 && (
                <BarList
                  title="Dias por etapa percorrida"
                  items={journey.daysByStage}
                  formatValue={(value) => (value === 1 ? '1 dia' : `${value} dias`)}
                />
              )}

              <p className={styles.note}>
                Os dias de pausa não entram na conta. O dia em que a etapa muda conta nas duas
                etapas, mas só uma vez nos dias de TPO.
              </p>
            </div>
          )}
        </Card>

        <section className={styles.block} aria-label="Registrar nesta etapa">
          <h2 className={styles.heading}>Registrar</h2>
          <div className={styles.quick}>
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                state={{ from: '/app/tpo' }}
                className={styles.quickItem}
              >
                {action.emoji && (
                  <span className={styles.quickEmoji} aria-hidden="true" data-emoji>
                    {action.emoji}
                  </span>
                )}
                {action.label}
              </Link>
            ))}
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

        <Modal
          open={endingModalOpen}
          title={endOutcome === 'paused' ? 'Pausar TPO' : 'Encerrar TPO'}
          onClose={() => setEndingModalOpen(false)}
          dismissOnBackdrop={false}
        >
          <div className={styles.confirm}>
            <Alert variant="info">{TPO_TEAM_MESSAGE}</Alert>

            <ChipGroup
              legend="Situação do TPO"
              options={END_OUTCOME_CHIPS}
              value={endOutcome}
              onChange={(value) => {
                setEndLocalError(undefined)
                setEndOutcome((value ?? 'paused') as TpoEndOutcome)
              }}
              clearable={false}
            />

            <Input
              label="Data e hora"
              type="datetime-local"
              min={periodStartedAt ? toDateTimeLocalValue(periodStartedAt) : undefined}
              value={endAt}
              onChange={(e) => {
                setEndAt(e.target.value)
                setEndLocalError(undefined)
              }}
            />

            <Textarea
              label="Anotação (opcional)"
              hint="Ex.: orientação da equipe assistente."
              rows={3}
              value={endNote}
              onChange={(e) => {
                setEndNote(e.target.value)
                setEndLocalError(undefined)
              }}
            />

            {endLocalError && <Alert variant="error">{endLocalError}</Alert>}
            {endState === 'error' && endErrorMessage && (
              <Alert variant="error">{endErrorMessage}</Alert>
            )}

            <div className={styles.confirmButtons}>
              <Button variant="ghost" onClick={() => setEndingModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                busy={endState === 'saving'}
                busyLabel="Salvando..."
                onClick={() => void handleEndTpo()}
              >
                {endOutcome === 'paused'
                  ? 'Pausar TPO'
                  : endOutcome === 'interrupted'
                    ? 'Interromper TPO'
                    : 'Encerrar TPO'}
              </Button>
            </div>
          </div>
        </Modal>
      </AppTemplate>
    )
  }

  return (
    <AppTemplate
      title="TPO"
      subtitle="Teste de Provocação Oral."
      bottomNav
      headerAside={
        <Link
          to="/app/relatorio"
          state={{ from: '/app/tpo' }}
          className={styles.reportButton}
          aria-label="Ver relatório para a consulta"
        >
          <FileText size={16} aria-hidden="true" />
          <span>Relatório</span>
        </Link>
      }
    >
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(undefined)} />
      )}

      {/* Um TPO pausado é o que a família mais provavelmente quer ver aqui:
          vem antes da introdução, com a retomada como ação principal. */}
      {pausedTpo && (
        <Card as="section" className={styles.block} aria-label="TPO pausado">
          <p className={styles.pausedText}>
            TPO pausado em {formatDate(pausedTpo.pausedAt)} na Etapa{' '}
            {pausedTpo.protocol.current_stage} —{' '}
            {stageLabelFrom(stages, pausedTpo.protocol.current_stage)}
          </p>
          <div className={styles.pausedActions}>
            <Button onClick={openResumeModal}>Retomar TPO</Button>
            <Button variant="secondary" onClick={openStartModal}>
              Iniciar um novo TPO
            </Button>
          </div>
        </Card>
      )}

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

      {!pausedTpo && <Button onClick={openStartModal}>Iniciar um TPO</Button>}

      {periods.length > 0 && (
        <section className={styles.historyWhenIdle} aria-label="Histórico de etapas">
          <h2 className={styles.heading}>Histórico</h2>
          <StageHistoryList
            periods={periods}
            labelFor={(ordinal) => stageLabelFrom(stages, ordinal)}
          />
        </section>
      )}

      {pausedTpo && (
        <Modal
          open={resumeModalOpen}
          title="Retomar o TPO?"
          onClose={() => setResumeModalOpen(false)}
          dismissOnBackdrop={false}
        >
          <div className={styles.confirm}>
            <Alert variant="info">{TPO_TEAM_MESSAGE}</Alert>

            <p className={styles.note}>
              O TPO volta na Etapa {pausedTpo.protocol.current_stage} —{' '}
              {stageLabelFrom(stages, pausedTpo.protocol.current_stage)}. A pausa continua
              registrada no histórico.
            </p>

            <Input
              label="Data e hora da retomada"
              type="datetime-local"
              min={toDateTimeLocalValue(pausedTpo.pausedAt)}
              value={resumeAt}
              onChange={(e) => {
                setResumeAt(e.target.value)
                setResumeLocalError(undefined)
              }}
            />

            <Textarea
              label="Observação (opcional)"
              hint="Ex.: orientação da equipe assistente."
              rows={2}
              value={resumeNote}
              onChange={(e) => {
                setResumeNote(e.target.value)
                setResumeLocalError(undefined)
              }}
            />

            {resumeLocalError && <Alert variant="error">{resumeLocalError}</Alert>}
            {resumeState === 'error' && resumeErrorMessage && (
              <Alert variant="error">{resumeErrorMessage}</Alert>
            )}

            <div className={styles.confirmButtons}>
              <Button variant="ghost" onClick={() => setResumeModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                busy={resumeState === 'saving'}
                busyLabel="Retomando..."
                onClick={() => void handleResumeTpo()}
              >
                Retomar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        open={confirming}
        title={pausedTpo ? 'Iniciar um novo TPO?' : 'Iniciar um TPO?'}
        onClose={() => setConfirming(false)}
        dismissOnBackdrop={false}
      >
        <div className={styles.confirm}>
          <Alert variant="info">{TPO_TEAM_MESSAGE}</Alert>

          <ChipGroup
            legend="Em qual etapa vai começar?"
            options={stageChips}
            value={initialStage}
            onChange={(value) => {
              setStartLocalError(undefined)
              setInitialStage(value ?? '1')
            }}
            clearable={false}
          />

          <Input
            label="Data e hora de início"
            type="datetime-local"
            value={startAt}
            onChange={(e) => {
              setStartAt(e.target.value)
              setStartLocalError(undefined)
            }}
          />

          <Textarea
            label="Observação (opcional)"
            rows={2}
            value={startNote}
            onChange={(e) => {
              setStartNote(e.target.value)
              setStartLocalError(undefined)
            }}
          />

          {startLocalError && <Alert variant="error">{startLocalError}</Alert>}
          {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}

          <div className={styles.confirmButtons}>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              busy={state === 'saving'}
              busyLabel="Iniciando..."
              onClick={() => void handleStartTpo()}
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
