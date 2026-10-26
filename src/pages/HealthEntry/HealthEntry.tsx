import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { HealthForm } from '@/components/organisms/HealthForm'
import type {
  HealthFormValues,
  TreatmentDoseInput,
} from '@/components/organisms/HealthForm/HealthForm'
import {
  healthKindMeta,
  latestWeightFrom,
  listActiveTreatments,
  readHealthData,
} from '@/constants/health'
import type { ActiveMedicationTreatment } from '@/constants/health'
import { useChild } from '@/hooks/useChild'
import { useCreateHealthRecord } from '@/hooks/useCreateHealthRecord'
import { useEntryMutation } from '@/hooks/useEntryMutation'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import { listHealthRecords, updateHealthRecord } from '@/services/health'
import { fromDateTimeLocalValue } from '@/utils/dates'
import type { HealthRecord } from '@/types'

export default function HealthEntry() {
  const { origin, returnAfterSave } = useReturnNavigation('/app')
  const { kind } = useParams()
  const meta = healthKindMeta(kind ?? '')
  const { child } = useChild()
  const childId = child?.id
  const { state, errorMessage, submit } = useCreateHealthRecord()
  const mutation = useEntryMutation()
  const [records, setRecords] = useState<HealthRecord[]>([])

  const loadHealthRecords = useCallback(
    (id: string, signal: { cancelled: boolean }) => {
      return listHealthRecords(id)
        .then((data) => {
          if (!signal.cancelled) setRecords(data)
        })
        .catch(() => {
          // Falha de leitura não bloqueia novo registro; o erro de escrita é tratado no submit.
        })
    },
    [],
  )

  useEffect(() => {
    if (!childId || (meta?.value !== 'medication' && meta?.value !== 'weight')) return
    const signal = { cancelled: false }
    void loadHealthRecords(childId, signal)
    return () => {
      signal.cancelled = true
    }
  }, [childId, meta?.value, loadHealthRecords])

  if (!meta) return <Navigate to="/app/saude" replace />

  const activeTreatments =
    meta.value === 'medication' ? listActiveTreatments(records) : []
  const lastWeightKg =
    meta.value === 'weight' ? (latestWeightFrom(records)?.kg ?? null) : null

  async function handleSubmit(values: HealthFormValues) {
    if (!meta) return
    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      kind: meta.value,
      title: values.title,
      data: values.data,
      note: values.note,
    })
    if (ok) {
      const flash =
        meta.value === 'medication' && values.data.entryType === 'treatment'
          ? 'Tratamento registrado.'
          : `${meta.label} registrado.`
      returnAfterSave(flash)
    }
  }

  async function handleLogDose(input: TreatmentDoseInput): Promise<boolean> {
    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(input.occurredAt),
      kind: 'medication',
      title: input.treatment.name,
      data: {
        entryType: 'dose',
        treatmentId: input.treatment.record.id,
        ...(input.dose ? { dose: input.dose } : {}),
        ...(input.treatment.intervalHours
          ? { intervalHours: input.treatment.intervalHours }
          : {}),
      },
      note: input.note,
    })
    if (ok) {
      returnAfterSave(`Dose de ${input.treatment.name} registrada.`)
    }
    return ok
  }

  async function handleEndTreatment(treatment: ActiveMedicationTreatment): Promise<boolean> {
    const currentData = readHealthData(treatment.record)
    const ok = await mutation.run(() =>
      updateHealthRecord(treatment.record.id, {
        title: treatment.record.title,
        data: {
          ...currentData,
          endedAt: new Date().toISOString(),
        },
        occurredAt: treatment.record.occurred_at,
        note: treatment.record.note,
      }),
    )
    if (ok && childId) await loadHealthRecords(childId, { cancelled: false })
    return ok
  }

  return (
    <ProtocolTemplate
      title={meta.label}
      subtitle="O app registra apenas o que foi prescrito pela equipe assistente e não sugere dose."
      backTo="/app/saude"
      backState={{ from: origin }}
    >
      <HealthForm
        key={meta.value}
        kind={meta.value}
        state={state}
        errorMessage={errorMessage ?? mutation.errorMessage}
        activeTreatments={activeTreatments}
        lastWeightKg={lastWeightKg}
        onSubmit={handleSubmit}
        onLogDose={handleLogDose}
        onEndTreatment={handleEndTreatment}
      />
    </ProtocolTemplate>
  )
}
