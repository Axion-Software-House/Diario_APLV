import { createSymptomEvolution } from '@/services/symptoms'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'
import type { SymptomEvolutionStatus } from '@/types'

export type NewSymptomEvolution = {
  symptomEventId: string
  occurredAt: string
  status: SymptomEvolutionStatus
  note: string | null
}

const write = (input: NewSymptomEvolution, context: RecordContext) =>
  createSymptomEvolution({
    userId: context.userId,
    childId: context.childId,
    ...input,
  })

/** Registra uma evolução (melhorou, ficou igual, piorou) de um episódio de sintomas. */
export function useCreateSymptomEvolution() {
  return useRecordWrite(write)
}
