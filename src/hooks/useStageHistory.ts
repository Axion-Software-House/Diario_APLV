import { useEffect, useState } from 'react'
import { listStageHistory } from '@/services/stages'
import { useChild } from '@/hooks/useChild'
import type { StageHistory } from '@/types'

/** Histórico de etapas da criança, do mais antigo para o mais recente. */
export function useStageHistory(): StageHistory[] {
  const { child } = useChild()
  const childId = child?.id
  const [periods, setPeriods] = useState<StageHistory[]>([])

  useEffect(() => {
    if (!childId) return
    let cancelled = false

    void listStageHistory(childId)
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
  }, [childId])

  return periods
}
