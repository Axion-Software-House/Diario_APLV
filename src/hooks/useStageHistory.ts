import { useEffect, useState } from 'react'
import { listStageHistory } from '@/services/stages'
import { useChild } from '@/hooks/useChild'
import type { StageHistory } from '@/types'

type Loaded = {
  /** Versão do TPO ativo que esta leitura reflete. */
  version: string
  periods: StageHistory[]
}

/** Histórico de etapas da criança, do mais antigo para o mais recente. */
export function useStageHistory(): StageHistory[] {
  const { child, activeTpo } = useChild()
  const childId = child?.id
  // Muda quando um TPO começa ou termina e a cada mudança de etapa (abre um
  // período novo): são os únicos momentos em que o histórico cresce, então é
  // o sinal para relê-lo.
  const historyVersion = `${activeTpo?.protocol.id ?? ''}:${activeTpo?.currentStagePeriod?.id ?? ''}`
  const [loaded, setLoaded] = useState<Loaded>({ version: '', periods: [] })

  useEffect(() => {
    if (!childId) return
    let cancelled = false

    void listStageHistory(childId)
      .then((result) => {
        if (!cancelled) setLoaded({ version: historyVersion, periods: result })
      })
      .catch(() => {
        if (!cancelled) setLoaded({ version: historyVersion, periods: [] })
      })

    return () => {
      cancelled = true
    }
  }, [childId, historyVersion])

  return loaded.periods
}
