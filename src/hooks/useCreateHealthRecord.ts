import { createHealthRecord } from '@/services/health'
import type { HealthData } from '@/services/health'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'
import type { HealthKind } from '@/types'

export type NewHealthRecord = {
  occurredAt: string
  kind: HealthKind
  title: string | null
  data: HealthData
  note: string | null
}

const write = (input: NewHealthRecord, context: RecordContext) =>
  createHealthRecord({ ...context, ...input })

export function useCreateHealthRecord() {
  return useRecordWrite(write)
}
