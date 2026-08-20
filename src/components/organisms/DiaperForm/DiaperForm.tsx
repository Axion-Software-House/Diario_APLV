import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { DIAPER_BLOOD, DIAPER_CONSISTENCY, DIAPER_MUCUS } from '@/constants/diaper'
import { diaperSchema } from '@/schemas/diaper.schema'
import type { DiaperValues } from '@/schemas/diaper.schema'
import { toDateTimeLocalValue } from '@/utils/dates'
import type { ActionState } from '@/types'
import styles from './DiaperForm.module.css'

type Props = {
  state: ActionState
  errorMessage?: string
  onSubmit: (values: DiaperValues) => void
}

/** Três seletores por toque, hora automática. Nada aqui exige digitar. */
export function DiaperForm({ state, errorMessage, onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DiaperValues>({
    resolver: zodResolver(diaperSchema),
    defaultValues: {
      blood: 'nao',
      mucus: 'nao',
      consistency: '',
      occurredAt: toDateTimeLocalValue(),
      note: '',
    },
  })

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller
        control={control}
        name="blood"
        render={({ field }) => (
          <ChipGroup
            legend="Sangue"
            options={DIAPER_BLOOD}
            value={field.value}
            onChange={(value) => field.onChange(value ?? 'nao')}
            clearable={false}
          />
        )}
      />

      <Controller
        control={control}
        name="mucus"
        render={({ field }) => (
          <ChipGroup
            legend="Muco"
            options={DIAPER_MUCUS}
            value={field.value}
            onChange={(value) => field.onChange(value ?? 'nao')}
            clearable={false}
          />
        )}
      />

      <Controller
        control={control}
        name="consistency"
        render={({ field }) => (
          <ChipGroup
            legend="Consistência (opcional)"
            options={DIAPER_CONSISTENCY}
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
