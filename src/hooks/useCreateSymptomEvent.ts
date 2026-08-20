import { useCallback, useState } from 'react'
import { createSymptomEvent } from '@/services/symptoms'
import type { SymptomItemInput } from '@/services/symptoms'
import { useAuth } from '@/hooks/useAuth'
import { useProtocol } from '@/hooks/useProtocol'
import { AppError, toAppError } from '@/lib/errors'
import type { ActionState } from '@/types'

export type NewSymptomEvent = {
  occurredAt: string
  items: SymptomItemInput[]
  exposureId: string | null
  noSymptoms: boolean
  note: string | null
}

/** Serve às duas telas do M6: sintomas marcados e "sem sintomas". */
export function useCreateSymptomEvent() {
  const { user } = useAuth()
  const { active } = useProtocol()
  const [state, setState] = useState<ActionState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const submit = useCallback(
    async (input: NewSymptomEvent) => {
      setState('saving')
      setErrorMessage(undefined)
      try {
        if (!user || !active) throw new AppError('auth/session-expired', 'Sua sessão expirou.')
        await createSymptomEvent({
          protocolId: active.protocol.id,
          occurredAt: input.occurredAt,
          items: input.items,
          exposureId: input.exposureId,
          noSymptoms: input.noSymptoms,
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
