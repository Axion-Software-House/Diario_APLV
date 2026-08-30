import { createExposure } from '@/services/exposures'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'
import type { ExposureAmount, FoodConsumer } from '@/types'

export type NewExposure = {
  consumer: FoodConsumer
  food: string
  amount: ExposureAmount | null
  brand: string | null
  details: string | null
  occurredAt: string
  note: string | null
}

const write = (input: NewExposure, context: RecordContext) =>
  createExposure({ ...context, ...input })

export function useCreateExposure() {
  return useRecordWrite(write)
}
