import { useNavigate } from 'react-router-dom'
import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
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
    <ProtocolTemplate title="Observação" subtitle="Uma anotação livre, com a hora.">
      <NoteForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </ProtocolTemplate>
  )
}
