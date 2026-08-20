import { useEffect, useState } from 'react'
import { listDiaperRecords } from '@/services/diapers'
import { listExposures } from '@/services/exposures'
import { listNotes } from '@/services/notes'
import { listSymptomEvents } from '@/services/symptoms'
import { useProtocol } from '@/hooks/useProtocol'
import { buildTimeline } from '@/utils/timeline'
import { toAppError } from '@/lib/errors'
import type { TimelineEvent } from '@/types'

type State = {
  events: TimelineEvent[]
  loading: boolean
  errorMessage?: string
}

/**
 * Busca as origens em paralelo e devolve a união já ordenada.
 *
 * Uma origem que falha derruba a leitura inteira de propósito: meia timeline
 * parece uma timeline completa, e um registro ausente viraria "não aconteceu".
 */
export function useTimeline(): State {
  const { active } = useProtocol()
  const protocolId = active?.protocol.id
  const [state, setState] = useState<State>({ events: [], loading: true })

  useEffect(() => {
    if (!protocolId) return
    let cancelled = false

    void Promise.all([
      listExposures(protocolId),
      listSymptomEvents(protocolId),
      listDiaperRecords(protocolId),
      listNotes(protocolId),
    ])
      .then(([exposures, symptomEvents, diaperRecords, notes]) => {
        if (!cancelled) {
          setState({
            events: buildTimeline({ exposures, symptomEvents, diaperRecords, notes }),
            loading: false,
          })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ events: [], loading: false, errorMessage: toAppError(error).message })
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
