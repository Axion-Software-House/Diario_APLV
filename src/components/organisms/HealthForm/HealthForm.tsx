import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { Card } from '@/components/molecules/Card'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { FormActions } from '@/components/molecules/FormActions'
import { FormDetails } from '@/components/molecules/FormDetails'
import { FormSection } from '@/components/molecules/FormSection'
import {
  formatWeightKg,
  hasLargeWeightVariation,
  MEDICATION_DURATION_OPTIONS,
  MEDICATION_ENTRY_MODES,
  MEDICATION_INTERVAL_OPTIONS,
  measuresToData,
  parseWeightKg,
} from '@/constants/health'
import type { ActiveMedicationTreatment, MedicationDurationMode } from '@/constants/health'
import { healthSchema, parseDecimalInput, validateTreatmentEnd } from '@/schemas/health.schema'
import type { HealthValues } from '@/schemas/health.schema'
import type { HealthData } from '@/services/health'
import { formatDateTime, isNotInFuture, toDateTimeLocalValue } from '@/utils/dates'
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
  lastWeightKg?: number | null
  onSubmit: (values: HealthFormValues) => void
  onLogDose?: (input: TreatmentDoseInput) => Promise<boolean>
  /** `endedAt` é o valor do `datetime-local` (fuso local), já validado. */
  onEndTreatment?: (treatment: ActiveMedicationTreatment, endedAt: string) => Promise<boolean>
}

/** Painel aberto dentro do card de um tratamento ativo (um por vez). */
type TreatmentPanel = { id: string; kind: 'dose' | 'end' } | null

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
  lastWeightKg,
  onSubmit,
  onLogDose,
  onEndTreatment,
}: Props) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HealthValues>({
    resolver: zodResolver(healthSchema),
    defaultValues: {
      kind,
      medMode: 'treatment',
      title: '',
      dose: '',
      // Intervalo e duração começam vazios: o app não sugere posologia, só
      // registra a que está na receita.
      intervalChoice: '',
      customHours: '',
      durationMode: 'days',
      durationDays: '',
      reaction: '',
      guidance: '',
      questions: '',
      kg: '',
      lengthCm: '',
      headCm: '',
      occurredAt: toDateTimeLocalValue(),
      note: '',
    },
  })

  const medMode = useWatch({ control, name: 'medMode' }) ?? 'treatment'
  const intervalChoice = useWatch({ control, name: 'intervalChoice' }) ?? ''
  const durationMode = useWatch({ control, name: 'durationMode' }) ?? 'days'
  const kgValue = useWatch({ control, name: 'kg' }) ?? ''

  // A confirmação de variação ≥ 20% guarda o NÚMERO a conferir, não o texto:
  // o valor que chega ao submit já passou pelo `trim` do zod, mas o do
  // `useWatch` não. Comparando strings, "12 " nunca batia com "12" e a
  // confirmação voltava em loop. `parseWeightKg` normaliza os dois lados
  // (espaços e vírgula), então "12 ", "12" e "12,0" são o mesmo peso.
  const [confirmedWeightKg, setConfirmedWeightKg] = useState<number | null>(null)
  const currentWeightKg = parseWeightKg(kgValue)
  const confirmingWeight =
    confirmedWeightKg !== null &&
    Number.isFinite(currentWeightKg) &&
    confirmedWeightKg === currentWeightKg

  const [openPanel, setOpenPanel] = useState<TreatmentPanel>(null)
  const [doseAt, setDoseAt] = useState(toDateTimeLocalValue())
  const [doseAmount, setDoseAmount] = useState('')
  const [doseNote, setDoseNote] = useState('')
  const [doseError, setDoseError] = useState<string>()
  const [endAt, setEndAt] = useState(toDateTimeLocalValue())
  const [endError, setEndError] = useState<string>()
  const [busyId, setBusyId] = useState<string | null>(null)

  function openDosePanel(treatment: ActiveMedicationTreatment) {
    setOpenPanel({ id: treatment.record.id, kind: 'dose' })
    setDoseAt(toDateTimeLocalValue())
    setDoseAmount(treatment.dose ?? '')
    setDoseNote('')
    setDoseError(undefined)
  }

  function openEndPanel(treatment: ActiveMedicationTreatment) {
    setOpenPanel({ id: treatment.record.id, kind: 'end' })
    setEndAt(toDateTimeLocalValue())
    setEndError(undefined)
  }

  async function handleConfirmDose(treatment: ActiveMedicationTreatment) {
    if (!onLogDose) return
    if (!doseAt || Number.isNaN(new Date(doseAt).getTime())) {
      setDoseError('Informe a data e a hora.')
      return
    }
    if (!isNotInFuture(doseAt)) {
      setDoseError('A data não pode estar no futuro.')
      return
    }
    if (doseAmount.trim().length > 120) {
      setDoseError('Use no máximo 120 caracteres na dose.')
      return
    }
    if (doseNote.trim().length > 2000) {
      setDoseError('Use no máximo 2000 caracteres na observação.')
      return
    }
    setDoseError(undefined)
    setBusyId(treatment.record.id)
    const ok = await onLogDose({
      treatment,
      occurredAt: doseAt,
      dose: doseAmount.trim() || treatment.dose,
      note: doseNote.trim() || null,
    })
    setBusyId(null)
    if (ok) setOpenPanel(null)
  }

  async function handleConfirmEnd(treatment: ActiveMedicationTreatment) {
    if (!onEndTreatment) return
    const error = validateTreatmentEnd(endAt, treatment.startedAt)
    if (error) {
      setEndError(error)
      return
    }
    setEndError(undefined)
    setBusyId(treatment.record.id)
    const ok = await onEndTreatment(treatment, endAt)
    setBusyId(null)
    if (ok) {
      setOpenPanel(null)
    } else {
      setEndError('Não foi possível encerrar o tratamento. Tente de novo.')
    }
  }

  function submit(values: HealthValues) {
    const title = values.title?.trim() ?? ''
    const dose = values.dose?.trim() ?? ''
    const reaction = values.reaction?.trim() ?? ''
    const guidance = values.guidance?.trim() ?? ''
    const questions = values.questions?.trim() ?? ''
    const kg = values.kg?.trim() ?? ''
    const note = values.note?.trim() ?? ''

    if (kind === 'weight') {
      // Só o peso pede confirmação de variação; sem peso, `NaN` não confirma nada.
      const value = parseWeightKg(kg)
      if (hasLargeWeightVariation(value, lastWeightKg) && !confirmingWeight) {
        setConfirmedWeightKg(value)
        return
      }
      setConfirmedWeightKg(null)
    }

    const data: HealthData = {}
    if (kind === 'medication') {
      if ((values.medMode ?? 'treatment') === 'treatment') {
        const hours =
          values.intervalChoice === 'custom'
            ? parseDecimalInput(values.customHours)
            : Number(values.intervalChoice)
        data.entryType = 'treatment'
        data.dose = dose
        data.intervalHours = hours
        data.durationMode = (values.durationMode ?? 'days') as MedicationDurationMode
        if (data.durationMode === 'days') {
          data.durationDays = parseDecimalInput(values.durationDays)
        }
      } else {
        data.entryType = 'single'
        if (dose) data.dose = dose
      }
    }
    if (kind === 'vaccine' && reaction) data.reaction = reaction
    if (kind === 'appointment') {
      if (guidance) data.guidance = guidance
      if (questions) data.questions = questions
    }
    if (kind === 'weight') {
      Object.assign(data, measuresToData({ kg, lengthCm: values.lengthCm, headCm: values.headCm }))
    }

    onSubmit({
      occurredAt: values.occurredAt,
      title: kind === 'weight' ? null : title,
      data,
      note: note || null,
    })
  }

  return (
    <div className={styles.wrapper}>
      {kind === 'medication' && activeTreatments.length > 0 && (
        <section className={styles.activeSection} aria-label="Tratamentos ativos">
          <h2 className={styles.sectionTitle}>Tratamentos ativos</h2>
          <ul className={styles.treatmentList}>
            {activeTreatments.map((treatment) => {
              const panel = openPanel?.id === treatment.record.id ? openPanel.kind : null
              const isBusy = busyId === treatment.record.id || state === 'saving'
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

                    {panel === 'dose' ? (
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
                        {doseError && <Alert variant="error">{doseError}</Alert>}
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
                            onClick={() => setOpenPanel(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : panel === 'end' ? (
                      <div className={styles.doseBox}>
                        <Input
                          label="Data e hora do encerramento"
                          hint="O tratamento sai da lista de ativos. As doses já registradas continuam no Diário."
                          type="datetime-local"
                          value={endAt}
                          min={toDateTimeLocalValue(treatment.startedAt)}
                          onChange={(e) => setEndAt(e.target.value)}
                        />
                        {endError && <Alert variant="error">{endError}</Alert>}
                        <div className={styles.treatmentActions}>
                          <Button
                            type="button"
                            busy={isBusy}
                            onClick={() => void handleConfirmEnd(treatment)}
                          >
                            Confirmar encerramento
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => setOpenPanel(null)}
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
                            onClick={() => openEndPanel(treatment)}
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

      <form className={styles.form} onSubmit={handleSubmit(submit)} noValidate>
        {kind === 'medication' && (
          <>
            <FormSection>
              <Controller
                control={control}
                name="medMode"
                render={({ field }) => (
                  <ChipGroup
                    legend="O que você quer registrar?"
                    options={ENTRY_MODE_CHIPS}
                    value={field.value ?? 'treatment'}
                    onChange={(value) =>
                      field.onChange((value ?? 'treatment') as 'treatment' | 'single')
                    }
                    clearable={false}
                  />
                )}
              />

              <Input
                label="Nome do medicamento"
                placeholder="Nome como está na receita"
                autoComplete="off"
                error={errors.title?.message}
                {...register('title')}
              />

              {medMode === 'treatment' && (
                <Input
                  label="Dose prescrita"
                  placeholder="Como está na receita"
                  autoComplete="off"
                  error={errors.dose?.message}
                  {...register('dose')}
                />
              )}
            </FormSection>

            {medMode === 'treatment' ? (
              <>
                <FormSection>
                  <Controller
                    control={control}
                    name="intervalChoice"
                    render={({ field }) => (
                      <ChipGroup
                        legend="Intervalo entre as doses"
                        options={INTERVAL_CHIPS}
                        value={field.value || null}
                        onChange={(value) => field.onChange(value ?? '')}
                        clearable={false}
                      />
                    )}
                  />
                  {errors.intervalChoice?.message && (
                    <p className={styles.fieldError} role="alert">
                      {errors.intervalChoice.message}
                    </p>
                  )}

                  {intervalChoice === 'custom' && (
                    <Input
                      label="A cada quantas horas?"
                      inputMode="decimal"
                      error={errors.customHours?.message}
                      {...register('customHours')}
                    />
                  )}

                  <Controller
                    control={control}
                    name="durationMode"
                    render={({ field }) => (
                      <ChipGroup
                        legend="Duração do tratamento"
                        options={DURATION_CHIPS}
                        value={field.value ?? 'days'}
                        onChange={(value) =>
                          field.onChange((value ?? 'days') as MedicationDurationMode)
                        }
                        clearable={false}
                      />
                    )}
                  />

                  {durationMode === 'days' && (
                    <Input
                      label="Por quantos dias?"
                      inputMode="numeric"
                      error={errors.durationDays?.message}
                      {...register('durationDays')}
                    />
                  )}
                </FormSection>

                <FormSection>
                  <Input
                    label="Início do tratamento"
                    type="datetime-local"
                    error={errors.occurredAt?.message}
                    {...register('occurredAt')}
                  />

                  <Textarea
                    label="Observação (opcional)"
                    hint="Só o que foi orientado pela equipe assistente."
                    error={errors.note?.message}
                    {...register('note')}
                  />
                </FormSection>
              </>
            ) : (
              <>
                <FormSection>
                  <Input
                    label="Data e hora"
                    type="datetime-local"
                    error={errors.occurredAt?.message}
                    {...register('occurredAt')}
                  />
                </FormSection>
                <FormDetails summary="Adicionar detalhes">
                  <Input
                    label="Dose (opcional)"
                    placeholder="Como está na receita"
                    error={errors.dose?.message}
                    {...register('dose')}
                  />
                  <Textarea
                    label="Observação (opcional)"
                    error={errors.note?.message}
                    {...register('note')}
                  />
                </FormDetails>
              </>
            )}
          </>
        )}

        {kind === 'vaccine' && (
          <>
            <FormSection>
              <Input
                label="Nome da vacina"
                autoComplete="off"
                error={errors.title?.message}
                {...register('title')}
              />
              <Input
                label="Data e hora"
                type="datetime-local"
                error={errors.occurredAt?.message}
                {...register('occurredAt')}
              />
            </FormSection>
            <FormSection>
              <Textarea
                label="Reação percebida (opcional)"
                error={errors.reaction?.message}
                {...register('reaction')}
              />
              <Textarea
                label="Observação (opcional)"
                error={errors.note?.message}
                {...register('note')}
              />
            </FormSection>
          </>
        )}

        {kind === 'appointment' && (
          <>
            <FormSection>
              <Input
                label="Especialidade"
                autoComplete="off"
                error={errors.title?.message}
                {...register('title')}
              />
              <Input
                label="Data e hora"
                type="datetime-local"
                error={errors.occurredAt?.message}
                {...register('occurredAt')}
              />
            </FormSection>
            <FormSection>
              <Textarea
                label="Principais orientações (opcional)"
                rows={3}
                error={errors.guidance?.message}
                {...register('guidance')}
              />
              <Textarea
                label="Dúvidas (opcional)"
                rows={2}
                error={errors.questions?.message}
                {...register('questions')}
              />
              <Textarea
                label="Observação (opcional)"
                error={errors.note?.message}
                {...register('note')}
              />
            </FormSection>
          </>
        )}

        {kind === 'weight' && (
          <>
            <FormSection>
              <p className={styles.measuresHint}>
                Preencha pelo menos uma medida. Pode usar vírgula: 7,85.
              </p>
              <div className={styles.measures}>
                <Input
                  label="Peso (kg)"
                  inputMode="decimal"
                  autoComplete="off"
                  error={errors.kg?.message}
                  {...register('kg')}
                />
                <Input
                  label="Comprimento ou altura (cm)"
                  inputMode="decimal"
                  autoComplete="off"
                  error={errors.lengthCm?.message}
                  {...register('lengthCm')}
                />
                <Input
                  label="Perímetro cefálico (cm)"
                  inputMode="decimal"
                  autoComplete="off"
                  error={errors.headCm?.message}
                  {...register('headCm')}
                />
              </div>
            </FormSection>
            <FormSection>
              <Input
                label="Data e hora"
                type="datetime-local"
                error={errors.occurredAt?.message}
                {...register('occurredAt')}
              />
              <Textarea
                label="Observação (opcional)"
                error={errors.note?.message}
                {...register('note')}
              />
            </FormSection>
          </>
        )}

        <div aria-live="polite">
          {confirmingWeight && lastWeightKg != null && (
            <Alert variant="info">
              O último peso registrado foi {formatWeightKg(lastWeightKg)} kg. Confira se é{' '}
              {formatWeightKg(currentWeightKg)} kg mesmo e toque em confirmar para salvar.
            </Alert>
          )}
          {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
        </div>

        <FormActions>
          <Button type="submit" busy={state === 'saving'}>
            {confirmingWeight
              ? `Confirmar ${formatWeightKg(currentWeightKg)} kg`
              : kind === 'medication' && medMode === 'treatment'
                ? 'Salvar tratamento'
                : 'Salvar registro'}
          </Button>
        </FormActions>
      </form>
    </div>
  )
}
