import { useEffect, useState } from 'react'
import { loadDiary } from '@/services/diary'
import { useChild } from '@/hooks/useChild'
import { toAppError } from '@/lib/errors'
import type { TimelineSources } from '@/utils/timeline'

const EMPTY: TimelineSources = {
  exposures: [],
  symptomEvents: [],
  diaperRecords: [],
  notes: [],
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
export function useDiary(): State {
  const { child } = useChild()
  const childId = child?.id
  const [state, setState] = useState<State>({ sources: EMPTY, loading: true })

  useEffect(() => {
    if (!childId) return
    let cancelled = false

    void loadDiary(childId)
      .then((sources) => {
        if (!cancelled) setState({ sources, loading: false })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ sources: EMPTY, loading: false, errorMessage: toAppError(error).message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [childId])

  // A rota protegida garante a criança; sem ela a tela não pode ficar presa.
  return { ...state, loading: childId ? state.loading : false }
}
