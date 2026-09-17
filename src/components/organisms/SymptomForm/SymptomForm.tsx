import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Chip } from '@/components/atoms/Chip'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { SafetyAlert } from '@/components/molecules/SafetyAlert'
import { SymptomRow } from '@/components/molecules/SymptomRow'
import {
  INTENSITIES,
  SYMPTOMS,
  SYMPTOM_GROUPS,
  SYMPTOM_SCREEN_MESSAGE,
} from '@/constants/symptoms'
import type { Intensity, SymptomGroupId } from '@/constants/symptoms'
import { symptomEventSchema } from '@/schemas/symptom.schema'
import type { SymptomEventValues } from '@/schemas/symptom.schema'
import { formatDateTime, formatElapsed, toDateTimeLocalValue } from '@/utils/dates'
import type { ActionState, Exposure } from '@/types'
import styles from './SymptomForm.module.css'

const SYMPTOM_LABELS = new Map(SYMPTOMS.map((symptom) => [symptom.code, symptom.label]))
const INTENSITY_LABELS = new Map(INTENSITIES.map((item) => [item.value, item.label]))

type Props = {
  state: ActionState
  errorMessage?: string
  /** Vínculo opcional com uma alimentação já registrada. */
  exposures: readonly Exposure[]
  onSubmit: (values: SymptomEventValues) => void
}

export function SymptomForm({ state, errorMessage, exposures, onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SymptomEventValues>({
    resolver: zodResolver(symptomEventSchema),
    defaultValues: {
      items: {},
      otherText: '',
      occurredAt: toDateTimeLocalValue(),
      exposureId: '',
      note: '',
    },
  })

  const [openGroup, setOpenGroup] = useState<SymptomGroupId | null>(null)

  const items = useWatch({ control, name: 'items' })
  const occurredAt = useWatch({ control, name: 'occurredAt' })
  const exposureId = useWatch({ control, name: 'exposureId' })

  const itemsError = typeof errors.items?.message === 'string' ? errors.items.message : undefined
  const alarmSigns = SYMPTOMS.filter((s) => s.alarm && items[s.code]).map((s) => s.label)
  const linked = exposures.find((exposure) => exposure.id === exposureId)
  const marked = Object.keys(items)
  const otherMarked = Boolean(items.other)

  function countFor(groupId: SymptomGroupId): number {
    return SYMPTOMS.filter((s) => s.group === groupId && items[s.code]).length
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Alert variant="info">{SYMPTOM_SCREEN_MESSAGE}</Alert>

      <Controller
        control={control}
        name="items"
        render={({ field }) => {
          function setIntensity(code: string, intensity: Intensity | null) {
            const next = { ...field.value }
            if (intensity === null) delete next[code]
            else next[code] = intensity
            field.onChange(next)
          }

          if (openGroup) {
            const group = SYMPTOM_GROUPS.find((g) => g.id === openGroup)
            return (
              <div className={styles.step}>
                <button
                  type="button"
                  className={styles.back}
                  onClick={() => setOpenGroup(null)}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  {group?.label}
                </button>
                <ul className={styles.rows}>
                  {SYMPTOMS.filter((symptom) => symptom.group === openGroup).map((symptom) => (
                    <SymptomRow
                      key={symptom.code}
                      symptom={symptom}
                      value={(field.value[symptom.code] as Intensity | undefined) ?? null}
                      onChange={(intensity) => setIntensity(symptom.code, intensity)}
                    />
                  ))}
                </ul>
              </div>
            )
          }

          return (
            <fieldset className={styles.step}>
              <legend className={styles.question}>O que você percebeu?</legend>
              <div className={styles.categories}>
                {SYMPTOM_GROUPS.map((group) => {
                  const count = countFor(group.id)
                  return (
                    <Chip
                      key={group.id}
                      selected={count > 0}
                      onClick={() => setOpenGroup(group.id)}
                    >
                      {group.label}
                      {count > 0 && <span className={styles.count}> · {count}</span>}
                    </Chip>
                  )
                })}
              </div>
            </fieldset>
          )
        }}
      />

      {otherMarked && (
        <Input
          label="O que foi? (opcional)"
          placeholder="Descreva o sintoma em poucas palavras"
          autoComplete="off"
          error={errors.otherText?.message}
          {...register('otherText')}
        />
      )}

      {marked.length > 0 && (
        <div className={styles.summary} aria-label="Sintomas marcados">
          {marked.map((code) => (
            <span key={code} className={styles.tag}>
              {SYMPTOM_LABELS.get(code) ?? code}
              <span className={styles.tagIntensity}>
                {' '}
                ({INTENSITY_LABELS.get(items[code] as Intensity)})
              </span>
            </span>
          ))}
        </div>
      )}

      <SafetyAlert signs={alarmSigns} />

      <Input
        label="Data e hora"
        type="datetime-local"
        error={errors.occurredAt?.message}
        {...register('occurredAt')}
      />

      {exposures.length > 0 && (
        <div className={styles.link}>
          <Controller
            control={control}
            name="exposureId"
            render={({ field }) => (
              <ChipGroup
                legend="Relacionar a uma alimentação (opcional)"
                options={exposures.map((exposure) => ({
                  value: exposure.id,
                  label: `${exposure.food} · ${formatDateTime(exposure.occurred_at)}`,
                }))}
                value={field.value || null}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
          {linked && (
            <p className={styles.interval}>
              {new Date(occurredAt) >= new Date(linked.occurred_at)
                ? `${formatElapsed(linked.occurred_at, occurredAt)} após a alimentação`
                : `${formatElapsed(linked.occurred_at, occurredAt)} antes da alimentação`}
            </p>
          )}
        </div>
      )}

      <Textarea
        label="Observação (opcional)"
        hint="Só o que você observou. Não é preciso interpretar."
        error={errors.note?.message}
        {...register('note')}
      />

      <div aria-live="polite">
        {itemsError && <Alert variant="error">{itemsError}</Alert>}
        {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      </div>

      <Button type="submit" busy={state === 'saving'}>
        Salvar registro
      </Button>
    </form>
  )
}
