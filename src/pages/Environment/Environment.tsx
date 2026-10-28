import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { EnvironmentForm } from '@/components/organisms/EnvironmentForm'
import { useCreateEnvironmentRecord } from '@/hooks/useCreateEnvironmentRecord'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import type { EnvironmentValues } from '@/schemas/environment.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'
import { EnvironmentSummary } from './EnvironmentSummary'

export default function Environment() {
  const { returnAfterSave } = useReturnNavigation()
  const { state, errorMessage, submit } = useCreateEnvironmentRecord()

  async function handleSubmit(values: EnvironmentValues) {
    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      place: values.place,
      different: values.different?.trim() || null,
      note: values.note?.trim() || null,
    })
    if (ok) returnAfterSave('Ambiente registrado.')
  }

  return (
    <ProtocolTemplate
      title="Ambiente / Visita"
      subtitle="Onde vocês estiveram."
      summary={<EnvironmentSummary />}
    >
      <EnvironmentForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </ProtocolTemplate>
  )
}
