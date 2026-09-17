import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { ENVIRONMENT_PLACES } from '@/constants/environments'
import { environmentSchema } from '@/schemas/environment.schema'
import type { EnvironmentValues } from '@/schemas/environment.schema'
import { toDateTimeLocalValue } from '@/utils/dates'
import type { ActionState } from '@/types'
import styles from './EnvironmentForm.module.css'

const PLACE_CHIPS = ENVIRONMENT_PLACES.map((o) => ({ value: o.value, label: o.label }))

type Props = {
  state: ActionState
  errorMessage?: string
  onSubmit: (values: EnvironmentValues) => void
}

export function EnvironmentForm({ state, errorMessage, onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EnvironmentValues>({
    resolver: zodResolver(environmentSchema),
    defaultValues: {
      place: undefined,
      different: '',
      occurredAt: toDateTimeLocalValue(),
      note: '',
    },
  })

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller
        control={control}
        name="place"
        render={({ field }) => (
          <ChipGroup
            legend="Onde vocês estiveram?"
            options={PLACE_CHIPS}
            value={field.value ?? null}
            onChange={(value) => field.onChange(value ?? undefined)}
            clearable={false}
          />
        )}
      />
      {errors.place?.message && <Alert variant="error">{errors.place.message}</Alert>}

      <Textarea
        label="Teve algo diferente do habitual? (opcional)"
        hint="Ex.: muita comida com leite no ambiente, outra cuidadora, ambiente novo."
        rows={3}
        error={errors.different?.message}
        {...register('different')}
      />

      <details className={styles.details}>
        <summary className={styles.summary}>
          <Plus size={16} aria-hidden="true" />
          Adicionar detalhes
        </summary>
        <div className={styles.detailsBody}>
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
        </div>
      </details>

      <div aria-live="polite">
        {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      </div>

      <Button type="submit" busy={state === 'saving'}>
        Salvar registro
      </Button>
    </form>
  )
}
