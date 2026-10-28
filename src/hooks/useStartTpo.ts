import { useCallback, useState } from 'react'
import { endTpo, resumeTpo, startTpo } from '@/services/protocols'
import type { EndTpoInput, ResumeTpoInput, StartTpoOptions } from '@/services/protocols'
import { useChild } from '@/hooks/useChild'
import { toAppError } from '@/lib/errors'
import type { ActionState } from '@/types'

/** Inicia uma reintrodução guiada para a criança ativa (README FINAL §21). */
export function useStartTpo() {
  const { child, refresh } = useChild()
  const [state, setState] = useState<ActionState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const submit = useCallback(
    async (options?: StartTpoOptions) => {
      if (!child) return false
      setState('saving')
      setErrorMessage(undefined)
      try {
        await startTpo(child.id, options)
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
    [child, refresh],
  )

  return { state, errorMessage, submit }
}

/** Pausa, encerra ou interrompe o TPO em andamento da criança ativa. */
export function useEndTpo() {
  const { refresh } = useChild()
  const [state, setState] = useState<ActionState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const submit = useCallback(
    async (input: EndTpoInput) => {
      setState('saving')
      setErrorMessage(undefined)
      try {
        await endTpo(input)
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

/** Retoma o TPO pausado da criança ativa, na etapa em que ele estava. */
export function useResumeTpo() {
  const { refresh } = useChild()
  const [state, setState] = useState<ActionState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const submit = useCallback(
    async (input: ResumeTpoInput) => {
      setState('saving')
      setErrorMessage(undefined)
      try {
        await resumeTpo(input)
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
