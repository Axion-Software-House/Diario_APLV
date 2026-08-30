import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { HealthForm } from '@/components/organisms/HealthForm'
import type { HealthFormValues } from '@/components/organisms/HealthForm/HealthForm'
import { healthKindMeta } from '@/constants/health'
import { useCreateHealthRecord } from '@/hooks/useCreateHealthRecord'
import { fromDateTimeLocalValue } from '@/utils/dates'

export default function HealthEntry() {
  const navigate = useNavigate()
  const { kind } = useParams()
  const meta = healthKindMeta(kind ?? '')
  const { state, errorMessage, submit } = useCreateHealthRecord()

  if (!meta) return <Navigate to="/app/saude" replace />

  async function handleSubmit(values: HealthFormValues) {
    if (!meta) return
    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      kind: meta.value,
      title: values.title,
      data: values.data,
      note: values.note,
    })
    if (ok) navigate('/app', { replace: true, state: { flash: `${meta.label} registrado.` } })
  }

  return (
    <ProtocolTemplate title={meta.label} subtitle="O app registra o que você informar.">
      <HealthForm
        key={meta.value}
        kind={meta.value}
        state={state}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
      />
    </ProtocolTemplate>
  )
}
