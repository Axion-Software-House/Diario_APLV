import { useCallback } from 'react'
import { createHealthRecord } from '@/services/health'
import type { HealthData } from '@/services/health'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'
import type { HealthKind } from '@/types'

export type NewHealthRecord = {
  occurredAt: string
  kind: HealthKind
  title: string | null
  data: HealthData
  note: string | null
}

/**
 * Saúde não pertence ao TPO (decisão do teste com cliente): o registro é
 * gravado sem `protocol_id` e sem `stage`, mesmo com TPO ativo.
 */
const write = ({ record }: { record: NewHealthRecord }, context: RecordContext) =>
  createHealthRecord({ ...context, ...record, protocolId: null, stage: null })

export function useCreateHealthRecord() {
  const { state, errorMessage, submit } = useRecordWrite(write)
  // O registro vai embrulhado em `record` de propósito: `useRecordWrite` só
  // procura `occurredAt` no topo do input para buscar o histórico de etapas
  // de uma data retroativa, e Saúde não usa etapa — assim não há essa
  // consulta (nem a chance de ela falhar e travar o registro).
  const submitRecord = useCallback((record: NewHealthRecord) => submit({ record }), [submit])
  return { state, errorMessage, submit: submitRecord }
}
