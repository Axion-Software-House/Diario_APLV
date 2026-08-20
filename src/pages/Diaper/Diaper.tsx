import { useNavigate } from 'react-router-dom'
import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { DiaperForm } from '@/components/organisms/DiaperForm'
import { useCreateDiaperRecord } from '@/hooks/useCreateDiaperRecord'
import type { DiaperValues } from '@/schemas/diaper.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'
import type { DiaperBlood, DiaperConsistency, DiaperMucus } from '@/types'

export default function Diaper() {
  const navigate = useNavigate()
  const { state, errorMessage, submit } = useCreateDiaperRecord()

  async function handleSubmit(values: DiaperValues) {
    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      blood: values.blood as DiaperBlood,
      mucus: values.mucus as DiaperMucus,
      consistency: (values.consistency || null) as DiaperConsistency | null,
      note: values.note?.trim() || null,
    })
    if (ok) navigate('/app', { replace: true, state: { flash: 'Fralda registrada.' } })
  }

  return (
    <ProtocolTemplate title="Fralda" subtitle="Toque no que você observou.">
      <DiaperForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </ProtocolTemplate>
  )
}
