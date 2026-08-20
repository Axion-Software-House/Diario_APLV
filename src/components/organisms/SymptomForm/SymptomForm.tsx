import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { SafetyAlert } from '@/components/molecules/SafetyAlert'
import { SymptomRow } from '@/components/molecules/SymptomRow'
import { SYMPTOMS, SYMPTOM_GROUPS, SYMPTOM_SCREEN_MESSAGE } from '@/constants/symptoms'
import type { Intensity } from '@/constants/symptoms'
import { symptomEventSchema } from '@/schemas/symptom.schema'
import type { SymptomEventValues } from '@/schemas/symptom.schema'
import { formatDateTime, formatElapsed, toDateTimeLocalValue } from '@/utils/dates'
import type { ActionState, Exposure } from '@/types'
import styles from './SymptomForm.module.css'

type Props = {
  state: ActionState
  errorMessage?: string
  /** Vínculo opcional com uma exposição já registrada. */
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
      occurredAt: toDateTimeLocalValue(),
      exposureId: '',
      note: '',
    },
  })

  const items = useWatch({ control, name: 'items' })
  const occurredAt = useWatch({ control, name: 'occurredAt' })
  const exposureId = useWatch({ control, name: 'exposureId' })

  // `errors.items` acumula os erros por chave do registro; só a mensagem do
  // refine (o objeto inteiro vazio) é uma string.
  const itemsError = typeof errors.items?.message === 'string' ? errors.items.message : undefined
  const alarmSigns = SYMPTOMS.filter((s) => s.alarm && items[s.code]).map((s) => s.label)
  const linked = exposures.find((exposure) => exposure.id === exposureId)

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Alert variant="info">{SYMPTOM_SCREEN_MESSAGE}</Alert>

      <Controller
        control={control}
        name="items"
        render={({ field }) => (
          <>
            {SYMPTOM_GROUPS.map((group) => (
              <fieldset key={group.id} className={styles.group}>
                <legend className={styles.groupTitle}>{group.label}</legend>
                <ul className={styles.rows}>
                  {SYMPTOMS.filter((symptom) => symptom.group === group.id).map((symptom) => (
                    <SymptomRow
                      key={symptom.code}
                      symptom={symptom}
                      value={(field.value[symptom.code] as Intensity | undefined) ?? null}
                      onChange={(intensity) => {
                        // Desmarcar remove a chave: o objeto vazio é o estado inicial.
                        const next = { ...field.value }
                        if (intensity === null) delete next[symptom.code]
                        else next[symptom.code] = intensity
                        field.onChange(next)
                      }}
                    />
                  ))}
                </ul>
              </fieldset>
            ))}
          </>
        )}
      />

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
                legend="Relacionar a uma exposição (opcional)"
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
                ? `${formatElapsed(linked.occurred_at, occurredAt)} após a exposição`
                : `${formatElapsed(linked.occurred_at, occurredAt)} antes da exposição`}
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
