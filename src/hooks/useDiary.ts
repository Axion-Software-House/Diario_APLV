import { useEffect, useState } from 'react'
import { loadDiary } from '@/services/diary'
import { useProtocol } from '@/hooks/useProtocol'
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
 * Carrega o diário inteiro do acompanhamento ativo.
 *
 * Uma origem que falha derruba a leitura inteira de propósito: meio diário
 * tem a mesma cara de um diário completo, e um registro ausente viraria
 * "não aconteceu" — tanto na timeline quanto no relatório.
 */
export function useDiary(): State {
  const { active } = useProtocol()
  const protocolId = active?.protocol.id
  const [state, setState] = useState<State>({ sources: EMPTY, loading: true })

  useEffect(() => {
    if (!protocolId) return
    let cancelled = false

    void loadDiary(protocolId)
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
  }, [protocolId])

  // A rota protegida garante o acompanhamento; sem ele a tela não pode
  // ficar presa em "carregando".
  return { ...state, loading: protocolId ? state.loading : false }
}
