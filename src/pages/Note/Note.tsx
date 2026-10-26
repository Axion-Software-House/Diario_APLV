import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { NoteForm } from '@/components/organisms/NoteForm'
import { useCreateNote } from '@/hooks/useCreateNote'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import type { NoteValues } from '@/schemas/note.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'

export default function Note() {
  const { returnAfterSave } = useReturnNavigation()
  const { state, errorMessage, submit } = useCreateNote()

  async function handleSubmit(values: NoteValues) {
    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      content: values.content,
    })
    if (ok) returnAfterSave('Observação registrada.')
  }

  return (
    <ProtocolTemplate title="Observação" subtitle="Uma anotação livre, com a hora.">
      <NoteForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </ProtocolTemplate>
  )
}
