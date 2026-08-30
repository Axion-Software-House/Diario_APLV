import { useEffect, useState } from 'react'
import { listExposures } from '@/services/exposures'
import { useChild } from '@/hooks/useChild'
import type { Exposure } from '@/types'

/**
 * Alimentos recentes para o vínculo opcional do registro de sintomas.
 * Falha de leitura não trava a tela: o vínculo é opcional, o registro não.
 */
export function useRecentExposures(): Exposure[] {
  const { child } = useChild()
  const childId = child?.id
  const [exposures, setExposures] = useState<Exposure[]>([])

  useEffect(() => {
    if (!childId) return
    let cancelled = false
    void listExposures(childId, 8)
      .then((result) => {
        if (!cancelled) setExposures(result)
      })
      .catch(() => {
        if (!cancelled) setExposures([])
      })
    return () => {
      cancelled = true
    }
  }, [childId])

  return exposures
}
