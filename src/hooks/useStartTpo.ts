import { useCallback, useState } from 'react'
import { startTpo } from '@/services/protocols'
import { useChild } from '@/hooks/useChild'
import { toAppError } from '@/lib/errors'
import type { ActionState } from '@/types'

/** Inicia uma reintrodução guiada para a criança ativa (README FINAL §21). */
export function useStartTpo() {
  const { child, refresh } = useChild()
  const [state, setState] = useState<ActionState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const submit = useCallback(async () => {
    if (!child) return false
    setState('saving')
    setErrorMessage(undefined)
    try {
      await startTpo(child.id)
      // Só depois da confirmação do banco o contexto é atualizado.
      await refresh()
      setState('success')
      return true
    } catch (error) {
      setErrorMessage(toAppError(error).message)
      setState('error')
      return false
    }
  }, [child, refresh])

  return { state, errorMessage, submit }
}
