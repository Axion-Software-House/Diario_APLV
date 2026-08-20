import { useEffect, useState } from 'react'
import { listStageHistory } from '@/services/stages'
import { useProtocol } from '@/hooks/useProtocol'
import type { StageHistory } from '@/types'

/** Histórico do acompanhamento ativo, do mais antigo para o mais recente. */
export function useStageHistory(): StageHistory[] {
  const { active } = useProtocol()
  const protocolId = active?.protocol.id
  const [periods, setPeriods] = useState<StageHistory[]>([])

  useEffect(() => {
    if (!protocolId) return
    let cancelled = false

    void listStageHistory(protocolId)
      .then((result) => {
        if (!cancelled) setPeriods(result)
      })
      .catch(() => {
        if (!cancelled) setPeriods([])
      })

    return () => {
      cancelled = true
    }
    // Mudar de etapa leva de volta à Home; a tela remonta na próxima visita.
  }, [protocolId])

  return periods
}
