import { createSymptomEvent } from '@/services/symptoms'
import type { SymptomItemInput } from '@/services/symptoms'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'

export type NewSymptomEvent = {
  occurredAt: string
  items: SymptomItemInput[]
  exposureId: string | null
  noSymptoms: boolean
  note: string | null
}

// `stage` não entra: a RPC lê do acompanhamento dentro do banco.
const write = (input: NewSymptomEvent, context: RecordContext) =>
  createSymptomEvent({ protocolId: context.protocolId, ...input })

/** Serve às duas telas do M6: sintomas marcados e "sem sintomas". */
export function useCreateSymptomEvent() {
  return useRecordWrite(write)
}
