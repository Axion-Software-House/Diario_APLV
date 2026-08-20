import { createNote } from '@/services/notes'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'

export type NewNote = {
  occurredAt: string
  content: string
}

const write = (input: NewNote, context: RecordContext) => createNote({ ...context, ...input })

export function useCreateNote() {
  return useRecordWrite(write)
}
