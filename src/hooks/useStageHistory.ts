import { useEffect, useState } from 'react'
import { listStageHistory } from '@/services/stages'
import { useChild } from '@/hooks/useChild'
import type { StageHistory } from '@/types'

/** Histórico de etapas da criança, do mais antigo para o mais recente. */
export function useStageHistory(): StageHistory[] {
  const { child, activeTpo } = useChild()
  const childId = child?.id
  const activeProtocolId = activeTpo?.protocol.id ?? null
  const [periods, setPeriods] = useState<StageHistory[]>([])

  useEffect(() => {
    if (!childId) return
    let cancelled = false

    void listStageHistory(childId)
      .then((result) => {
        if (!cancelled && activeProtocolId !== undefined) setPeriods(result)
      })
      .catch(() => {
        if (!cancelled) setPeriods([])
      })

    return () => {
      cancelled = true
    }
  }, [childId, activeProtocolId])

  return periods
}
