import { useCallback, useState } from 'react'
import { createExposure } from '@/services/exposures'
import { useAuth } from '@/hooks/useAuth'
import { useProtocol } from '@/hooks/useProtocol'
import { AppError, toAppError } from '@/lib/errors'
import type { ActionState, ExposureAmount } from '@/types'

export type NewExposure = {
  food: string
  amount: ExposureAmount | null
  occurredAt: string
  note: string | null
}

/**
 * Ciclo idle → saving → success/error de um registro de exposição.
 * `user_id`, `protocol_id` e `stage` saem do acompanhamento ativo:
 * a tela não pergunta nem confia neles vindos do formulário.
 */
export function useCreateExposure() {
  const { user } = useAuth()
  const { active } = useProtocol()
  const [state, setState] = useState<ActionState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const submit = useCallback(
    async (input: NewExposure) => {
      setState('saving')
      setErrorMessage(undefined)
      try {
        if (!user || !active) throw new AppError('auth/session-expired', 'Sua sessão expirou.')
        await createExposure({
          userId: user.id,
          protocolId: active.protocol.id,
          stage: active.protocol.current_stage,
          occurredAt: input.occurredAt,
          food: input.food,
          amount: input.amount,
          note: input.note,
        })
        setState('success')
        return true
      } catch (error) {
        setErrorMessage(toAppError(error).message)
        setState('error')
        return false
      }
    },
    [user, active],
  )

  return { state, errorMessage, submit }
}
