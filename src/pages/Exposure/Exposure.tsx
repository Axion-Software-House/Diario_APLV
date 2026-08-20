import { useNavigate } from 'react-router-dom'
import { AppTemplate } from '@/components/templates/AppTemplate'
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
      food: values.food,
      amount: (values.amount || null) as ExposureAmount | null,
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      note: values.note?.trim() || null,
    })
    // Só volta depois da confirmação do banco; no erro o formulário fica como está.
    if (ok) navigate('/app', { replace: true, state: { flash: 'Exposição registrada.' } })
  }

  return (
    <AppTemplate title="Exposição" subtitle="O que foi consumido e quando." backTo="/app">
      <ExposureForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </AppTemplate>
  )
}
