import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { noteSchema } from '@/schemas/note.schema'
import type { NoteValues } from '@/schemas/note.schema'
import { toDateTimeLocalValue } from '@/utils/dates'
import type { ActionState } from '@/types'
import styles from './NoteForm.module.css'

type Props = {
  state: ActionState
  errorMessage?: string
  onSubmit: (values: NoteValues) => void
}

export function NoteForm({ state, errorMessage, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NoteValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: '', occurredAt: toDateTimeLocalValue() },
  })

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Textarea
        label="Observação"
        hint="Só o que você observou. Não é preciso interpretar."
        rows={5}
        error={errors.content?.message}
        {...register('content')}
      />

      <Input
        label="Data e hora"
        type="datetime-local"
        error={errors.occurredAt?.message}
        {...register('occurredAt')}
      />

      <div aria-live="polite">
        {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      </div>

      <Button type="submit" busy={state === 'saving'}>
        Salvar observação
      </Button>
    </form>
  )
}
