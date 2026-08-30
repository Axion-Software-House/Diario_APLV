import { createEnvironmentRecord } from '@/services/environments'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'

export type NewEnvironmentRecord = {
  occurredAt: string
  place: string
  different: string | null
  note: string | null
}

const write = (input: NewEnvironmentRecord, context: RecordContext) =>
  createEnvironmentRecord({ ...context, ...input })

export function useCreateEnvironmentRecord() {
  return useRecordWrite(write)
}
