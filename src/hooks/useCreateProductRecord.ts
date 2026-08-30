import { createProductRecord } from '@/services/products'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'

export type NewProductRecord = {
  occurredAt: string
  category: string
  isNew: boolean | null
  name: string | null
  brand: string | null
  note: string | null
}

const write = (input: NewProductRecord, context: RecordContext) =>
  createProductRecord({ ...context, ...input })

export function useCreateProductRecord() {
  return useRecordWrite(write)
}
