import { useCallback, useEffect, useState } from 'react'
import { useChild } from '@/hooks/useChild'
import { toAppError } from '@/lib/errors'
import { listHealthRecords } from '@/services/health'
import type { HealthRecord } from '@/types'

type State = {
  records: HealthRecord[]
  loading: boolean
  errorMessage?: string
}

/**
 * Registros de saúde da criança ativa, com o estado da leitura. Os resumos
 * da Saúde só afirmam "nenhum registro" depois de `loading` virar `false`
 * sem `errorMessage` — lista vazia por falha não é lista vazia.
 */
export function useHealthRecords(): State & { refresh: () => Promise<void> } {
  const { child } = useChild()
  const childId = child?.id
  const [state, setState] = useState<State>({ records: [], loading: true })

  const load = useCallback((id: string, signal: { cancelled: boolean }) => {
    return listHealthRecords(id)
      .then((records) => {
        if (!signal.cancelled) setState({ records, loading: false })
      })
      .catch((error: unknown) => {
        if (!signal.cancelled) {
          setState({ records: [], loading: false, errorMessage: toAppError(error).message })
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

  // Recarrega sem voltar ao "Carregando...", para o painel não piscar.
  const refresh = useCallback(async () => {
    if (childId) await load(childId, { cancelled: false })
  }, [childId, load])

  return { ...state, refresh }
}
