import { useNavigate } from 'react-router-dom'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { NoteForm } from '@/components/organisms/NoteForm'
import { useCreateNote } from '@/hooks/useCreateNote'
import type { NoteValues } from '@/schemas/note.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'

export default function Note() {
  const navigate = useNavigate()
  const { state, errorMessage, submit } = useCreateNote()

  async function handleSubmit(values: NoteValues) {
    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      content: values.content,
    })
    if (ok) navigate('/app', { replace: true, state: { flash: 'Observação registrada.' } })
  }

  return (
    <AppTemplate title="Observação" subtitle="Uma anotação livre, com a hora." backTo="/app">
      <NoteForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </AppTemplate>
  )
}
