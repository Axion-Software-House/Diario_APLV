import { useNavigate } from 'react-router-dom'
import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { EnvironmentForm } from '@/components/organisms/EnvironmentForm'
import { useCreateEnvironmentRecord } from '@/hooks/useCreateEnvironmentRecord'
import type { EnvironmentValues } from '@/schemas/environment.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'

export default function Environment() {
  const navigate = useNavigate()
  const { state, errorMessage, submit } = useCreateEnvironmentRecord()

  async function handleSubmit(values: EnvironmentValues) {
    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      place: values.place,
      different: values.different?.trim() || null,
      note: values.note?.trim() || null,
    })
    if (ok) navigate('/app', { replace: true, state: { flash: 'Ambiente registrado.' } })
  }

  return (
    <ProtocolTemplate title="Ambiente / Visita" subtitle="Onde vocês estiveram.">
      <EnvironmentForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </ProtocolTemplate>
  )
}
