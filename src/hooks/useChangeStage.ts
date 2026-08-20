import { useCallback } from 'react'
import { changeStage } from '@/services/stages'
import { useProtocol } from '@/hooks/useProtocol'
import { useRecordWrite } from '@/hooks/useRecordWrite'
import type { RecordContext } from '@/hooks/useRecordWrite'
import type { StageOutcome } from '@/types'

export type StageChange = {
  outcome: StageOutcome
  note: string | null
}

export function useChangeStage() {
  const { refresh } = useProtocol()

  const write = useCallback(
    async (input: StageChange, context: RecordContext) => {
      await changeStage({ protocolId: context.protocolId, ...input })
      // Só depois da confirmação do banco a etapa da tela muda.
      await refresh()
    },
    [refresh],
  )

  return useRecordWrite(write)
}
