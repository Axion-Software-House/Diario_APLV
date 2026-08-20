import { useCallback, useState } from 'react'
import { toAppError } from '@/lib/errors'
import type { ActionState } from '@/types'

/**
 * Envolve uma ação de autenticação no ciclo idle → saving → success/error.
 * Nenhum componente monta esse estado à mão.
 */
export function useAuthAction<T>(action: (input: T) => Promise<void>) {
  const [state, setState] = useState<ActionState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const run = useCallback(
    async (input: T) => {
      setState('saving')
      setErrorMessage(undefined)
      try {
        await action(input)
        setState('success')
        return true
      } catch (error) {
        // A mensagem exibida vem sempre do mapeador — nunca do banco.
        setErrorMessage(toAppError(error).message)
        setState('error')
        return false
      }
    },
    [action],
  )

  return { state, errorMessage, run }
}
