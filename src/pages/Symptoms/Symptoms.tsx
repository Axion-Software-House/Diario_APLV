import { useNavigate } from 'react-router-dom'
import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { SymptomForm } from '@/components/organisms/SymptomForm'
import { useCreateSymptomEvent } from '@/hooks/useCreateSymptomEvent'
import { useRecentExposures } from '@/hooks/useRecentExposures'
import type { SymptomEventValues } from '@/schemas/symptom.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'
import type { Intensity } from '@/constants/symptoms'

export default function Symptoms() {
  const navigate = useNavigate()
  const exposures = useRecentExposures()
  const { state, errorMessage, submit } = useCreateSymptomEvent()

  async function handleSubmit(values: SymptomEventValues) {
    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      items: Object.entries(values.items).map(([code, intensity]) => ({
        code,
        intensity: intensity as Intensity,
      })),
      exposureId: values.exposureId || null,
      noSymptoms: false,
      note: values.note?.trim() || null,
    })
    if (ok) navigate('/app', { replace: true, state: { flash: 'Sintomas registrados.' } })
  }

  return (
    <ProtocolTemplate title="Sintomas" subtitle="Toque na intensidade para marcar.">
      <SymptomForm
        state={state}
        errorMessage={errorMessage}
        exposures={exposures}
        onSubmit={handleSubmit}
      />
    </ProtocolTemplate>
  )
}
