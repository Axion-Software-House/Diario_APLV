import { useCallback, useEffect, useState } from 'react'
import { loadDiary } from '@/services/diary'
import { useChild } from '@/hooks/useChild'
import { toAppError } from '@/lib/errors'
import type { TimelineSources } from '@/utils/timeline'

const EMPTY: TimelineSources = {
  exposures: [],
  symptomEvents: [],
  diaperRecords: [],
  notes: [],
  productRecords: [],
  environmentRecords: [],
  stageHistory: [],
}

type State = {
  sources: TimelineSources
  loading: boolean
  errorMessage?: string
}

/**
 * Carrega o diário inteiro da criança ativa.
 *
 * Uma origem que falha derruba a leitura inteira de propósito: meio diário
 * tem a mesma cara de um diário completo, e um registro ausente viraria
 * "não aconteceu" — tanto na timeline quanto no relatório.
 */
export function useDiary(): State & { refresh: () => Promise<void> } {
  const { child } = useChild()
  const childId = child?.id
  const [state, setState] = useState<State>({ sources: EMPTY, loading: true })

  const load = useCallback((id: string, signal: { cancelled: boolean }) => {
    return loadDiary(id)
      .then((sources) => {
        if (!signal.cancelled) setState({ sources, loading: false })
      })
      .catch((error: unknown) => {
        if (!signal.cancelled) {
          setState({ sources: EMPTY, loading: false, errorMessage: toAppError(error).message })
        }
      })
  }, [])

  useEffect(() => {
    if (!childId) return
    const signal = { cancelled: false }
    void load(childId, signal)
    return () => {
      signal.cancelled = true
    }
  }, [childId, load])

  // Recarrega em silêncio depois de um editar/excluir — sem piscar o spinner.
  const refresh = useCallback(async () => {
    if (childId) await load(childId, { cancelled: false })
  }, [childId, load])

  // A rota protegida garante a criança; sem ela a tela não pode ficar presa.
  return { ...state, loading: childId ? state.loading : false, refresh }
}
