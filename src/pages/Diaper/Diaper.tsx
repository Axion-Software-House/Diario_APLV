import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { DiaperForm } from '@/components/organisms/DiaperForm'
import { useCreateDiaperRecord } from '@/hooks/useCreateDiaperRecord'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import type { DiaperValues } from '@/schemas/diaper.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'
import type { DiaperBlood, DiaperConsistency, DiaperMucus } from '@/types'
import { DiaperSummary } from './DiaperSummary'

export default function Diaper() {
  const { returnAfterSave } = useReturnNavigation()
  const { state, errorMessage, submit } = useCreateDiaperRecord()

  async function handleSubmit(values: DiaperValues) {
    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      blood: values.blood as DiaperBlood,
      mucus: values.mucus as DiaperMucus,
      consistency: (values.consistency || null) as DiaperConsistency | null,
      note: values.note?.trim() || null,
    })
    if (ok) returnAfterSave('Fralda registrada.')
  }

  return (
    <ProtocolTemplate
      title="Fralda"
      subtitle="Toque no que você observou."
      summary={<DiaperSummary />}
    >
      <DiaperForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </ProtocolTemplate>
  )
}
