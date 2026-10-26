import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { HealthForm } from '@/components/organisms/HealthForm'
import type { HealthFormValues } from '@/components/organisms/HealthForm/HealthForm'
import { healthKindMeta, readHealthData } from '@/constants/health'
import { useChild } from '@/hooks/useChild'
import { useCreateHealthRecord } from '@/hooks/useCreateHealthRecord'
import { listHealthRecords } from '@/services/health'
import { fromDateTimeLocalValue } from '@/utils/dates'

export default function HealthEntry() {
  const navigate = useNavigate()
  const { kind } = useParams()
  const meta = healthKindMeta(kind ?? '')
  const { child } = useChild()
  const { state, errorMessage, submit } = useCreateHealthRecord()
  const [lastWeightKg, setLastWeightKg] = useState<number | null>(null)

  useEffect(() => {
    if (meta?.value !== 'weight' || !child) return
    let active = true
    void listHealthRecords(child.id)
      .then((records) => {
        if (!active) return
        const latestWeight = records.find(
          (record) => record.kind === 'weight' && typeof readHealthData(record).kg === 'number',
        )
        setLastWeightKg(latestWeight ? (readHealthData(latestWeight).kg ?? null) : null)
      })
      .catch(() => {
        if (active) setLastWeightKg(null)
      })
    return () => {
      active = false
    }
  }, [child, meta?.value])

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
        lastWeightKg={meta.value === 'weight' ? lastWeightKg : null}
        onSubmit={handleSubmit}
      />
    </ProtocolTemplate>
  )
}
