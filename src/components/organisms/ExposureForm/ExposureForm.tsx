import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { EXPOSURE_AMOUNTS } from '@/constants/exposure'
import { exposureSchema } from '@/schemas/exposure.schema'
import type { ExposureValues } from '@/schemas/exposure.schema'
import { toDateTimeLocalValue } from '@/utils/dates'
import type { ActionState } from '@/types'
import styles from './ExposureForm.module.css'

const AMOUNT_CHIPS = EXPOSURE_AMOUNTS.map((option) => ({
  value: option.value,
  label: option.label,
}))

type Props = {
  state: ActionState
  errorMessage?: string
  onSubmit: (values: ExposureValues) => void
}

export function ExposureForm({ state, errorMessage, onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExposureValues>({
    resolver: zodResolver(exposureSchema),
    defaultValues: {
      food: '',
      amount: '',
      // Horário real, preenchido sozinho: a usuária só mexe se precisar corrigir.
      occurredAt: toDateTimeLocalValue(),
      note: '',
    },
  })

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        label="O que foi consumido"
        placeholder="Ex.: iogurte de leite de vaca"
        autoComplete="off"
        error={errors.food?.message}
        {...register('food')}
      />

      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <ChipGroup
            legend="Quantidade (opcional)"
            options={AMOUNT_CHIPS}
            value={field.value || null}
            onChange={(value) => field.onChange(value ?? '')}
          />
        )}
      />

      <Input
        label="Data e hora"
        type="datetime-local"
        error={errors.occurredAt?.message}
        {...register('occurredAt')}
      />

      <Textarea
        label="Observação (opcional)"
        hint="Só o que você observou. Não é preciso interpretar."
        error={errors.note?.message}
        {...register('note')}
      />

      <div aria-live="polite">
        {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      </div>

      <Button type="submit" busy={state === 'saving'}>
        Salvar registro
      </Button>
    </form>
  )
}
