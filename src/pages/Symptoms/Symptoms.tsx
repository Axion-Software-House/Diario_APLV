import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { SymptomForm } from '@/components/organisms/SymptomForm'
import { useCreateSymptomEvent } from '@/hooks/useCreateSymptomEvent'
import { useRecentExposures } from '@/hooks/useRecentExposures'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import type { SymptomEventValues } from '@/schemas/symptom.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'
import type { Intensity } from '@/constants/symptoms'

export default function Symptoms() {
  const { returnAfterSave } = useReturnNavigation()
  const exposures = useRecentExposures()
  const { state, errorMessage, submit } = useCreateSymptomEvent()

  async function handleSubmit(values: SymptomEventValues) {
    // "Outro" não tem código de catálogo com rótulo: o texto vai para a observação.
    const other = values.items.other ? values.otherText?.trim() : ''
    const note = [other ? `Outro: ${other}` : '', values.note?.trim() ?? '']
      .filter(Boolean)
      .join(' — ')

    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      items: Object.entries(values.items).map(([code, intensity]) => ({
        code,
        intensity: intensity as Intensity,
      })),
      exposureId: values.exposureId || null,
      noSymptoms: false,
      note: note || null,
    })
    if (ok) returnAfterSave('Sintomas registrados.')
  }

  return (
    <ProtocolTemplate title="Sintomas" subtitle="O que você percebeu?">
      <SymptomForm
        state={state}
        errorMessage={errorMessage}
        exposures={exposures}
        onSubmit={handleSubmit}
      />
    </ProtocolTemplate>
  )
}
