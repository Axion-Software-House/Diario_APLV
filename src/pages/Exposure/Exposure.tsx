import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { ExposureForm } from '@/components/organisms/ExposureForm'
import { useChild } from '@/hooks/useChild'
import { useCreateExposure } from '@/hooks/useCreateExposure'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import type { ExposureValues } from '@/schemas/exposure.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'
import type { ExposureAmount, ExposureDairy, FoodConsumer } from '@/types'
import { ExposureSummary } from './ExposureSummary'

export default function Exposure() {
  const { returnAfterSave } = useReturnNavigation()
  const { activeTpo } = useChild()
  const { state, errorMessage, submit } = useCreateExposure()

  const hasActiveTpo = Boolean(activeTpo)

  async function handleSubmit(values: ExposureValues) {
    const ok = await submit({
      consumer: values.consumer as FoodConsumer,
      food: values.food,
      isTpoFood: hasActiveTpo && values.isTpoFood === 'sim',
      containsDairy: (values.containsDairy || null) as ExposureDairy | null,
      amount: (values.amount || null) as ExposureAmount | null,
      brand: values.brand?.trim() || null,
      details: values.details?.trim() || null,
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      note: values.note?.trim() || null,
    })
    // Só volta depois da confirmação do banco; no erro o formulário fica como está.
    if (ok) returnAfterSave('Alimentação registrada.')
  }

  return (
    <ProtocolTemplate
      title="Alimentação"
      subtitle="O que a mãe ou a criança consumiu."
      summary={<ExposureSummary />}
    >
      <ExposureForm
        state={state}
        errorMessage={errorMessage}
        hasActiveTpo={hasActiveTpo}
        onSubmit={handleSubmit}
      />
    </ProtocolTemplate>
  )
}
