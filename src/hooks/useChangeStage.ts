import { useCallback } from 'react'
import { changeStage } from '@/services/stages'
import { useChild } from '@/hooks/useChild'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'
import { AppError } from '@/lib/errors'
import type { StageOutcome } from '@/types'

export type StageChange = {
  outcome: StageOutcome
  note: string | null
}

export function useChangeStage() {
  const { refresh } = useChild()

  const write = useCallback(
    async (input: StageChange, context: RecordContext) => {
      if (!context.protocolId) {
        throw new AppError('unknown', 'Nenhum TPO em andamento.')
      }
      await changeStage({ protocolId: context.protocolId, ...input })
      // Só depois da confirmação do banco a etapa da tela muda.
      await refresh()
    },
    [refresh],
  )

  return useRecordWrite(write)
}
