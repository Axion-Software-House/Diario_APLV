import { useCallback, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useChild } from '@/hooks/useChild'
import { AppError, toAppError } from '@/lib/errors'
import type { ActionState } from '@/types'

/**
 * Onde o registro entra. `childId` é sempre a criança ativa. `protocolId` e
 * `stage` só vêm preenchidos quando há um TPO em andamento — a maioria dos
 * registros do diário acontece fora de um TPO.
 */
export type RecordContext = {
  userId: string
  childId: string
  protocolId: string | null
  stage: number | null
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
  const { child, activeTpo } = useChild()
  const [state, setState] = useState<ActionState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const submit = useCallback(
    async (input: T) => {
      setState('saving')
      setErrorMessage(undefined)
      try {
        if (!user || !child) throw new AppError('auth/session-expired', 'Sua sessão expirou.')
        await write(input, {
          userId: user.id,
          childId: child.id,
          protocolId: activeTpo?.protocol.id ?? null,
          stage: activeTpo?.protocol.current_stage ?? null,
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
    [user, child, activeTpo, write],
  )

  return { state, errorMessage, submit }
}
