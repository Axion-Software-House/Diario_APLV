import { useCallback, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useProtocol } from '@/hooks/useProtocol'
import { AppError, toAppError } from '@/lib/errors'
import type { ActionState } from '@/types'

/** Quem e onde — sai do acompanhamento ativo, nunca do formulário. */
export type RecordContext = {
  userId: string
  protocolId: string
  stage: number
}

/**
 * Ciclo idle → saving → success/error de toda escrita do diário
 * (02-arquitetura.md). Um lugar só para: travar o botão durante o saving,
 * traduzir o erro pelo mapeador e nunca deixar a tela limpar antes da
 * confirmação do banco.
 *
 * `write` precisa ser estável — defina fora do componente.
 */
export function useRecordWrite<T>(write: (input: T, context: RecordContext) => Promise<unknown>) {
  const { user } = useAuth()
  const { active } = useProtocol()
  const [state, setState] = useState<ActionState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const submit = useCallback(
    async (input: T) => {
      setState('saving')
      setErrorMessage(undefined)
      try {
        if (!user || !active) throw new AppError('auth/session-expired', 'Sua sessão expirou.')
        await write(input, {
          userId: user.id,
          protocolId: active.protocol.id,
          stage: active.protocol.current_stage,
        })
        setState('success')
        return true
      } catch (error) {
        // A mensagem exibida vem sempre do mapeador — nunca do banco.
        setErrorMessage(toAppError(error).message)
        setState('error')
        return false
      }
    },
    [user, active, write],
  )

  return { state, errorMessage, submit }
}
