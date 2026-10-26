import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { SymptomForm } from '@/components/organisms/SymptomForm'
import { useCreateSymptomEvolution } from '@/hooks/useCreateSymptomEvolution'
import { useCreateSymptomEvent } from '@/hooks/useCreateSymptomEvent'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import { useSymptomLinkOptions } from '@/hooks/useSymptomLinkOptions'
import type { SymptomEventValues, SymptomEvolutionValues } from '@/schemas/symptom.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'
import type { Intensity } from '@/constants/symptoms'

export default function Symptoms() {
  const { returnAfterSave } = useReturnNavigation()
  const { exposures, environments, products, symptomEvents } = useSymptomLinkOptions()
  const { state, errorMessage, submit } = useCreateSymptomEvent()
  const {
    state: evolutionState,
    errorMessage: evolutionErrorMessage,
    submit: submitEvolution,
  } = useCreateSymptomEvolution()

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
      environmentId: values.environmentId || null,
      productId: values.productId || null,
      noSymptoms: false,
      note: note || null,
    })
    if (ok) returnAfterSave('Sintomas registrados.')
  }

  async function handleSubmitEvolution(values: SymptomEvolutionValues) {
    const ok = await submitEvolution({
      symptomEventId: values.symptomEventId,
      status: values.status,
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      note: values.note?.trim() || null,
    })
    if (ok) returnAfterSave('Evolução registrada.')
  }

  return (
    <ProtocolTemplate title="Sintomas" subtitle="O que você percebeu?">
      <SymptomForm
        state={state}
        errorMessage={errorMessage}
        exposures={exposures}
        environments={environments}
        products={products}
        symptomEvents={symptomEvents}
        evolutionState={evolutionState}
        evolutionErrorMessage={evolutionErrorMessage}
        onSubmit={handleSubmit}
        onSubmitEvolution={handleSubmitEvolution}
      />
    </ProtocolTemplate>
  )
}
