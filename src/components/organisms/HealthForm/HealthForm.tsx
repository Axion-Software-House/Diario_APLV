import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { healthSchema } from '@/schemas/health.schema'
import type { HealthValues } from '@/schemas/health.schema'
import type { HealthData } from '@/services/health'
import { toDateTimeLocalValue } from '@/utils/dates'
import type { ActionState, HealthKind } from '@/types'
import styles from './HealthForm.module.css'

export type HealthFormValues = {
  occurredAt: string
  title: string | null
  data: HealthData
  note: string | null
}

type Props = {
  kind: HealthKind
  state: ActionState
  errorMessage?: string
  onSubmit: (values: HealthFormValues) => void
}

/**
 * Um formulário, quatro formas — README FINAL §13–16. O app só registra o
 * que foi informado: não sugere medicamento, dose nem conduta.
 */
export function HealthForm({ kind, state, errorMessage, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HealthValues>({
    resolver: zodResolver(healthSchema),
    defaultValues: {
      kind,
      title: '',
      dose: '',
      reaction: '',
      guidance: '',
      questions: '',
      kg: '',
      occurredAt: toDateTimeLocalValue(),
      note: '',
    },
  })

  function submit(values: HealthValues) {
    const title = values.title?.trim() ?? ''
    const dose = values.dose?.trim() ?? ''
    const reaction = values.reaction?.trim() ?? ''
    const guidance = values.guidance?.trim() ?? ''
    const questions = values.questions?.trim() ?? ''
    const kg = values.kg?.trim() ?? ''
    const note = values.note?.trim() ?? ''

    const data: HealthData = {}
    if (kind === 'medication' && dose) data.dose = dose
    if (kind === 'vaccine' && reaction) data.reaction = reaction
    if (kind === 'appointment') {
      if (guidance) data.guidance = guidance
      if (questions) data.questions = questions
    }
    if (kind === 'weight') data.kg = Number(kg.replace(',', '.'))

    onSubmit({
      occurredAt: values.occurredAt,
      title: kind === 'weight' ? null : title,
      data,
      note: note || null,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(submit)} noValidate>
      {kind === 'medication' && (
        <>
          <Input
            label="Nome do medicamento"
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
          <details className={styles.details}>
            <summary className={styles.summary}>
              <Plus size={16} aria-hidden="true" />
              Adicionar detalhes
            </summary>
            <div className={styles.detailsBody}>
              <Input
                label="Dose (opcional)"
                error={errors.dose?.message}
                {...register('dose')}
              />
              <Textarea
                label="Observação (opcional)"
                error={errors.note?.message}
                {...register('note')}
              />
            </div>
          </details>
        </>
      )}

      {kind === 'vaccine' && (
        <>
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
        </>
      )}

      {kind === 'appointment' && (
        <>
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
        </>
      )}

      {kind === 'weight' && (
        <>
          <Input
            label="Peso (kg)"
            inputMode="decimal"
            error={errors.kg?.message}
            {...register('kg')}
          />
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
        </>
      )}

      <div aria-live="polite">
        {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      </div>

      <Button type="submit" busy={state === 'saving'}>
        Salvar registro
      </Button>
    </form>
  )
}
