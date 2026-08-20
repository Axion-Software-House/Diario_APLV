import { createExposure } from '@/services/exposures'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'
import type { ExposureAmount } from '@/types'

export type NewExposure = {
  food: string
  amount: ExposureAmount | null
  occurredAt: string
  note: string | null
}

const write = (input: NewExposure, context: RecordContext) =>
  createExposure({ ...context, ...input })

export function useCreateExposure() {
  return useRecordWrite(write)
}
