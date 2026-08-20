import { useCallback, useState } from 'react'
import { createOnboarding } from '@/services/protocols'
import type { OnboardingInput } from '@/services/protocols'
import { useProtocol } from '@/hooks/useProtocol'
import { toAppError } from '@/lib/errors'
import type { ActionState } from '@/types'

export function useOnboarding() {
  const { refresh } = useProtocol()
  const [state, setState] = useState<ActionState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const submit = useCallback(
    async (input: OnboardingInput) => {
      setState('saving')
      setErrorMessage(undefined)
      try {
        await createOnboarding(input)
        // Só depois da confirmação do banco o contexto é atualizado.
        await refresh()
        setState('success')
        return true
      } catch (error) {
        setErrorMessage(toAppError(error).message)
        setState('error')
        return false
      }
    },
    [refresh],
  )

  return { state, errorMessage, submit }
}
