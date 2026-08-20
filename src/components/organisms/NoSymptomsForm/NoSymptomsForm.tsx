import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { noSymptomsSchema } from '@/schemas/symptom.schema'
import type { NoSymptomsValues } from '@/schemas/symptom.schema'
import { toDateTimeLocalValue } from '@/utils/dates'
import type { ActionState } from '@/types'
import styles from './NoSymptomsForm.module.css'

type Props = {
  state: ActionState
  errorMessage?: string
  onSubmit: (values: NoSymptomsValues) => void
}

/** Um campo obrigatório só: quando. O resto é opcional de propósito. */
export function NoSymptomsForm({ state, errorMessage, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NoSymptomsValues>({
    resolver: zodResolver(noSymptomsSchema),
    defaultValues: { occurredAt: toDateTimeLocalValue(), note: '' },
  })

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        label="Data e hora"
        type="datetime-local"
        error={errors.occurredAt?.message}
        {...register('occurredAt')}
      />

      <Textarea label="Observação (opcional)" error={errors.note?.message} {...register('note')} />

      <div aria-live="polite">
        {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      </div>

      <Button type="submit" busy={state === 'saving'}>
        Registrar sem sintomas
      </Button>
    </form>
  )
}
