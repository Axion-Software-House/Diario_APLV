import { useNavigate } from 'react-router-dom'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { NoSymptomsForm } from '@/components/organisms/NoSymptomsForm'
import { useCreateSymptomEvent } from '@/hooks/useCreateSymptomEvent'
import type { NoSymptomsValues } from '@/schemas/symptom.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'

export default function NoSymptoms() {
  const navigate = useNavigate()
  const { state, errorMessage, submit } = useCreateSymptomEvent()

  async function handleSubmit(values: NoSymptomsValues) {
    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      items: [],
      exposureId: null,
      noSymptoms: true,
      note: values.note?.trim() || null,
    })
    if (ok) navigate('/app', { replace: true, state: { flash: 'Registro sem sintomas salvo.' } })
  }

  return (
    <AppTemplate
      title="Sem sintomas"
      subtitle="Registra um momento em que nada foi observado."
      backTo="/app"
    >
      <NoSymptomsForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </AppTemplate>
  )
}
