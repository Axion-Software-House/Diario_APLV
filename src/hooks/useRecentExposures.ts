import { useEffect, useState } from 'react'
import { listExposures } from '@/services/exposures'
import { useProtocol } from '@/hooks/useProtocol'
import type { Exposure } from '@/types'

/**
 * Exposições recentes para o vínculo opcional do registro de sintomas.
 * Falha de leitura não trava a tela: o vínculo é opcional, o registro não.
 */
export function useRecentExposures(): Exposure[] {
  const { active } = useProtocol()
  const protocolId = active?.protocol.id
  const [exposures, setExposures] = useState<Exposure[]>([])

  useEffect(() => {
    if (!protocolId) return
    let cancelled = false
    void listExposures(protocolId, 8)
      .then((result) => {
        if (!cancelled) setExposures(result)
      })
      .catch(() => {
        if (!cancelled) setExposures([])
      })
    return () => {
      cancelled = true
    }
  }, [protocolId])

  return exposures
}
