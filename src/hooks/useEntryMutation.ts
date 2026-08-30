import { useCallback, useState } from 'react'
import { toAppError } from '@/lib/errors'
import type { ActionState } from '@/types'

/** Ciclo idle → saving → success/error para editar e excluir no Diário. */
export function useEntryMutation() {
  const [state, setState] = useState<ActionState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    setState('saving')
    setErrorMessage(undefined)
    try {
      await fn()
      setState('success')
      return true
    } catch (error) {
      setErrorMessage(toAppError(error).message)
      setState('error')
      return false
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setErrorMessage(undefined)
  }, [])

  return { state, errorMessage, run, reset }
}
