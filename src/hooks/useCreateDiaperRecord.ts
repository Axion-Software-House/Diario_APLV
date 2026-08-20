import { createDiaperRecord } from '@/services/diapers'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'
import type { DiaperBlood, DiaperConsistency, DiaperMucus } from '@/types'

export type NewDiaperRecord = {
  occurredAt: string
  blood: DiaperBlood
  mucus: DiaperMucus
  consistency: DiaperConsistency | null
  note: string | null
}

const write = (input: NewDiaperRecord, context: RecordContext) =>
  createDiaperRecord({ ...context, ...input })

export function useCreateDiaperRecord() {
  return useRecordWrite(write)
}
