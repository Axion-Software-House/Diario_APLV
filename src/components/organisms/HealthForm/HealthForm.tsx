import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { Card } from '@/components/molecules/Card'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import {
  MEDICATION_DURATION_OPTIONS,
  MEDICATION_ENTRY_MODES,
  MEDICATION_INTERVAL_OPTIONS,
} from '@/constants/health'
import type { ActiveMedicationTreatment, MedicationDurationMode } from '@/constants/health'
import type { HealthData } from '@/services/health'
import { formatDateTime, toDateTimeLocalValue } from '@/utils/dates'
import type { ActionState, HealthKind } from '@/types'
import styles from './HealthForm.module.css'

export type HealthFormValues = {
  occurredAt: string
  title: string | null
  data: HealthData
  note: string | null
}

export type TreatmentDoseInput = {
  treatment: ActiveMedicationTreatment
  occurredAt: string
  dose: string | null
  note: string | null
}

type Props = {
  kind: HealthKind
  state: ActionState
  errorMessage?: string
  activeTreatments?: readonly ActiveMedicationTreatment[]
  onSubmit: (values: HealthFormValues) => void
  onLogDose?: (input: TreatmentDoseInput) => Promise<boolean>
  onEndTreatment?: (treatment: ActiveMedicationTreatment) => Promise<boolean>
}

const ENTRY_MODE_CHIPS = MEDICATION_ENTRY_MODES.map((item) => ({
  value: item.value,
  label: item.label,
}))
const INTERVAL_CHIPS = MEDICATION_INTERVAL_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}))
const DURATION_CHIPS = MEDICATION_DURATION_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}))

/**
 * Um formulário, quatro formas — README FINAL §13–16. O app só registra o
 * que foi informado: não sugere medicamento, dose nem conduta.
 */
export function HealthForm({
  kind,
  state,
  errorMessage,
  activeTreatments = [],
  onSubmit,
  onLogDose,
  onEndTreatment,
}: Props) {
  const [medMode, setMedMode] = useState<'treatment' | 'single'>('treatment')
  const [title, setTitle] = useState('')
  const [dose, setDose] = useState('')
  const [intervalChoice, setIntervalChoice] = useState('8')
  const [customHours, setCustomHours] = useState('')
  const [durationMode, setDurationMode] = useState<MedicationDurationMode>('days')
  const [durationDays, setDurationDays] = useState('5')
  const [reaction, setReaction] = useState('')
  const [guidance, setGuidance] = useState('')
  const [questions, setQuestions] = useState('')
  const [kg, setKg] = useState('')
  const [occurredAt, setOccurredAt] = useState(toDateTimeLocalValue())
  const [note, setNote] = useState('')
  const [localError, setLocalError] = useState<string>()

  const [openDoseFor, setOpenDoseFor] = useState<string | null>(null)
  const [doseAt, setDoseAt] = useState(toDateTimeLocalValue())
  const [doseAmount, setDoseAmount] = useState('')
  const [doseNote, setDoseNote] = useState('')
  const [doseBusyId, setDoseBusyId] = useState<string | null>(null)

  function openDosePanel(treatment: ActiveMedicationTreatment) {
    setOpenDoseFor(treatment.record.id)
    setDoseAt(toDateTimeLocalValue())
    setDoseAmount(treatment.dose ?? '')
    setDoseNote('')
  }

  async function handleConfirmDose(treatment: ActiveMedicationTreatment) {
    if (!onLogDose) return
    setDoseBusyId(treatment.record.id)
    const ok = await onLogDose({
      treatment,
      occurredAt: doseAt,
      dose: doseAmount.trim() || treatment.dose,
      note: doseNote.trim() || null,
    })
    setDoseBusyId(null)
    if (ok) setOpenDoseFor(null)
  }

  async function handleFinishTreatment(treatment: ActiveMedicationTreatment) {
    if (!onEndTreatment) return
    setDoseBusyId(treatment.record.id)
    await onEndTreatment(treatment)
    setDoseBusyId(null)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (kind === 'weight') {
      const value = Number(kg.replace(',', '.'))
      if (!kg.trim() || Number.isNaN(value) || value <= 0) {
        setLocalError('Informe o peso.')
        return
      }
    } else if (!title.trim()) {
      setLocalError(
        kind === 'appointment' ? 'Informe a especialidade.' : 'Informe o nome.',
      )
      return
    }

    const data: HealthData = {}

    if (kind === 'medication') {
      if (medMode === 'treatment') {
        if (!dose.trim()) {
          setLocalError('Informe a dose prescrita.')
          return
        }
        const hours =
          intervalChoice === 'custom'
            ? Number(customHours.replace(',', '.'))
            : Number(intervalChoice)
        if (!hours || Number.isNaN(hours) || hours <= 0) {
          setLocalError('Informe o intervalo entre as doses em horas.')
          return
        }
        if (durationMode === 'days') {
          const days = Number(durationDays)
          if (!days || Number.isNaN(days) || days < 1) {
            setLocalError('Informe por quantos dias o tratamento foi prescrito.')
            return
          }
          data.durationDays = Math.round(days)
        }
        data.entryType = 'treatment'
        data.dose = dose.trim()
        data.intervalHours = hours
        data.durationMode = durationMode
      } else {
        data.entryType = 'single'
        if (dose.trim()) data.dose = dose.trim()
      }
    }

    if (kind === 'vaccine' && reaction.trim()) data.reaction = reaction.trim()
    if (kind === 'appointment') {
      if (guidance.trim()) data.guidance = guidance.trim()
      if (questions.trim()) data.questions = questions.trim()
    }
    if (kind === 'weight') data.kg = Number(kg.replace(',', '.'))

    setLocalError(undefined)

    onSubmit({
      occurredAt,
      title: kind === 'weight' ? null : title.trim(),
      data,
      note: note.trim() || null,
    })
  }

  return (
    <div className={styles.wrapper}>
      {kind === 'medication' && activeTreatments.length > 0 && (
        <section className={styles.activeSection} aria-label="Tratamentos ativos">
          <h2 className={styles.sectionTitle}>Tratamentos ativos</h2>
          <ul className={styles.treatmentList}>
            {activeTreatments.map((treatment) => {
              const isDoseOpen = openDoseFor === treatment.record.id
              const isBusy = doseBusyId === treatment.record.id || state === 'saving'
              return (
                <li key={treatment.record.id}>
                  <Card className={styles.treatmentCard} active>
                    <div className={styles.treatmentHeader}>
                      <h3 className={styles.treatmentName}>{treatment.name}</h3>
                      <Badge tone="primary">{treatment.statusLabel}</Badge>
                    </div>
                    <p className={styles.treatmentSchedule}>{treatment.scheduleLabel}</p>
                    <p className={styles.treatmentMeta}>
                      Início: {formatDateTime(treatment.startedAt)} ·{' '}
                      {treatment.doseCount === 0
                        ? 'Nenhuma dose registrada ainda'
                        : `${treatment.doseCount} ${
                            treatment.doseCount === 1 ? 'dose registrada' : 'doses registradas'
                          }${
                            treatment.lastDoseAt
                              ? ` (última em ${formatDateTime(treatment.lastDoseAt)})`
                              : ''
                          }`}
                    </p>

                    {isDoseOpen ? (
                      <div className={styles.doseBox}>
                        <Input
                          label="Horário da dose dada"
                          type="datetime-local"
                          value={doseAt}
                          onChange={(e) => setDoseAt(e.target.value)}
                        />
                        <Input
                          label="Dose dada"
                          value={doseAmount}
                          onChange={(e) => setDoseAmount(e.target.value)}
                        />
                        <Input
                          label="Observação (opcional)"
                          value={doseNote}
                          onChange={(e) => setDoseNote(e.target.value)}
                        />
                        <div className={styles.treatmentActions}>
                          <Button
                            type="button"
                            busy={isBusy}
                            onClick={() => void handleConfirmDose(treatment)}
                          >
                            Salvar dose dada
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => setOpenDoseFor(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.treatmentActions}>
                        <Button
                          type="button"
                          onClick={() => openDosePanel(treatment)}
                          disabled={isBusy}
                        >
                          Registrar dose dada
                        </Button>
                        {onEndTreatment && (
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => void handleFinishTreatment(treatment)}
                          >
                            Encerrar tratamento
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {kind === 'medication' && (
          <>
            <ChipGroup
              legend="O que você quer registrar?"
              options={ENTRY_MODE_CHIPS}
              value={medMode}
              onChange={(value) => {
                setLocalError(undefined)
                setMedMode((value ?? 'treatment') as 'treatment' | 'single')
              }}
              clearable={false}
            />

            <Input
              label="Nome do medicamento"
              placeholder="Ex.: domperidona, simeticona"
              autoComplete="off"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            {medMode === 'treatment' ? (
              <>
                <Input
                  label="Dose prescrita"
                  placeholder="Ex.: 2 ml, 5 gotas, 1 sachê"
                  autoComplete="off"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                />

                <ChipGroup
                  legend="Intervalo entre as doses"
                  options={INTERVAL_CHIPS}
                  value={intervalChoice}
                  onChange={(value) => setIntervalChoice(value ?? '8')}
                  clearable={false}
                />

                {intervalChoice === 'custom' && (
                  <Input
                    label="A cada quantas horas?"
                    inputMode="decimal"
                    placeholder="Ex.: 2"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                  />
                )}

                <ChipGroup
                  legend="Duração do tratamento"
                  options={DURATION_CHIPS}
                  value={durationMode}
                  onChange={(value) =>
                    setDurationMode((value ?? 'days') as MedicationDurationMode)
                  }
                  clearable={false}
                />

                {durationMode === 'days' && (
                  <Input
                    label="Por quantos dias?"
                    inputMode="numeric"
                    placeholder="Ex.: 5"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                  />
                )}

                <Input
                  label="Início do tratamento"
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                />

                <Textarea
                  label="Observação (opcional)"
                  hint="Só o que foi orientado pela equipe assistente."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </>
            ) : (
              <>
                <Input
                  label="Data e hora"
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                />
                <details className={styles.details}>
                  <summary className={styles.summary}>
                    <Plus size={16} aria-hidden="true" />
                    Adicionar detalhes
                  </summary>
                  <div className={styles.detailsBody}>
                    <Input
                      label="Dose (opcional)"
                      placeholder="Ex.: 2 ml, 5 gotas"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                    />
                    <Textarea
                      label="Observação (opcional)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </details>
              </>
            )}
          </>
        )}

        {kind === 'vaccine' && (
          <>
            <Input
              label="Nome da vacina"
              autoComplete="off"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Data e hora"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
            <Textarea
              label="Reação percebida (opcional)"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
            />
            <Textarea
              label="Observação (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </>
        )}

        {kind === 'appointment' && (
          <>
            <Input
              label="Especialidade"
              autoComplete="off"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Data e hora"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
            <Textarea
              label="Principais orientações (opcional)"
              rows={3}
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
            />
            <Textarea
              label="Dúvidas (opcional)"
              rows={2}
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
            />
            <Textarea
              label="Observação (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </>
        )}

        {kind === 'weight' && (
          <>
            <Input
              label="Peso (kg)"
              inputMode="decimal"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
            />
            <Input
              label="Data e hora"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
            <Textarea
              label="Observação (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </>
        )}

        <div aria-live="polite">
          {localError && <Alert variant="error">{localError}</Alert>}
          {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
        </div>

        <Button type="submit" busy={state === 'saving'}>
          {kind === 'medication' && medMode === 'treatment'
            ? 'Salvar tratamento'
            : 'Salvar registro'}
        </Button>
      </form>
    </div>
  )
}
