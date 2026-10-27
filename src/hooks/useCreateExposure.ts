import { createExposure } from '@/services/exposures'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'
import type { ExposureAmount, ExposureDairy, FoodConsumer } from '@/types'

export type NewExposure = {
  consumer: FoodConsumer
  food: string
  /**
   * Com TPO ativo, a etapa e o protocolo só são vinculados à alimentação
   * quando a família informa que este é o alimento do TPO (`true`).
   * Alimentação de rotina (`false`) fica sem etapa para não distorcer as
   * contagens da etapa nem o relatório.
   */
  isTpoFood: boolean
  containsDairy: ExposureDairy | null
  amount: ExposureAmount | null
  brand: string | null
  details: string | null
  occurredAt: string
  note: string | null
}

const write = ({ isTpoFood, ...input }: NewExposure, context: RecordContext) =>
  createExposure({
    userId: context.userId,
    childId: context.childId,
    protocolId: isTpoFood ? context.protocolId : null,
    stage: isTpoFood ? context.stage : null,
    ...input,
  })

export function useCreateExposure() {
  return useRecordWrite(write)
}
