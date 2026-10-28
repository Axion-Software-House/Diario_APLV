import { Navigate, useParams } from 'react-router-dom'
import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { HealthForm, HealthKindSummary } from '@/components/organisms/HealthForm'
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
import { useCreateHealthRecord } from '@/hooks/useCreateHealthRecord'
import { useEntryMutation } from '@/hooks/useEntryMutation'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import { useHealthRecords } from '@/pages/Health/useHealthRecords'
import { updateHealthRecord } from '@/services/health'
import { fromDateTimeLocalValue } from '@/utils/dates'
import type { HealthKind } from '@/types'

/** Aviso depois de salvar, com a concordância de cada tipo. */
const SAVED_MESSAGES: Record<HealthKind, string> = {
  medication: 'Medicamento registrado.',
  vaccine: 'Vacina registrada.',
  appointment: 'Consulta registrada.',
  weight: 'Medidas registradas.',
}

export default function HealthEntry() {
  const { origin, returnAfterSave } = useReturnNavigation('/app')
  const { kind } = useParams()
  const meta = healthKindMeta(kind ?? '')
  const { state, errorMessage, submit } = useCreateHealthRecord()
  const mutation = useEntryMutation()
  // Falha de leitura não bloqueia novo registro: só o resumo mostra o erro.
  const health = useHealthRecords()
  const { records } = health

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
          : SAVED_MESSAGES[meta.value]
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

  async function handleEndTreatment(
    treatment: ActiveMedicationTreatment,
    endedAt: string,
  ): Promise<boolean> {
    const currentData = readHealthData(treatment.record)
    const ok = await mutation.run(() =>
      updateHealthRecord(treatment.record.id, {
        title: treatment.record.title,
        data: {
          ...currentData,
          endedAt: fromDateTimeLocalValue(endedAt),
        },
        occurredAt: treatment.record.occurred_at,
        note: treatment.record.note,
      }),
    )
    if (ok) await health.refresh()
    return ok
  }

  return (
    <ProtocolTemplate
      title={meta.label}
      subtitle={
        meta.value === 'medication'
          ? 'O app registra apenas o que foi prescrito pela equipe assistente e não sugere dose.'
          : undefined
      }
      backTo="/app/saude"
      backState={{ from: origin }}
      showTpo={false}
      summary={
        <HealthKindSummary
          kind={meta.value}
          state={{
            records,
            loading: health.loading,
            errorMessage: health.errorMessage,
            onRetry: health.refresh,
          }}
        />
      }
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
