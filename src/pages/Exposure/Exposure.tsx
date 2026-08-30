import { useNavigate } from 'react-router-dom'
import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { ExposureForm } from '@/components/organisms/ExposureForm'
import { useCreateExposure } from '@/hooks/useCreateExposure'
import type { ExposureValues } from '@/schemas/exposure.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'
import type { ExposureAmount } from '@/types'

export default function Exposure() {
  const navigate = useNavigate()
  const { state, errorMessage, submit } = useCreateExposure()

  async function handleSubmit(values: ExposureValues) {
    const ok = await submit({
      consumer: 'child',
      food: values.food,
      amount: (values.amount || null) as ExposureAmount | null,
      brand: null,
      details: null,
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      note: values.note?.trim() || null,
    })
    // Só volta depois da confirmação do banco; no erro o formulário fica como está.
    if (ok) navigate('/app', { replace: true, state: { flash: 'Exposição registrada.' } })
  }

  return (
    <ProtocolTemplate title="Exposição" subtitle="O que foi consumido e quando.">
      <ExposureForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </ProtocolTemplate>
  )
}
