import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function readOrigin(state: unknown): string | undefined {
  if (typeof state !== 'object' || state === null) return undefined
  const from = Reflect.get(state, 'from')
  return typeof from === 'string' && from.startsWith('/') ? from : undefined
}

/**
 * Resolve a tela de origem (`location.state.from`) para os botões "Voltar" e
 * para o redirecionamento pós-salvamento, usando `/app` como reserva quando a
 * rota é aberta direto sem histórico.
 */
export function useReturnNavigation(fallback = '/app') {
  const location = useLocation()
  const navigate = useNavigate()
  const origin = readOrigin(location.state) ?? fallback

  const returnAfterSave = useCallback(
    (flash: string) => {
      navigate(origin, { replace: true, state: { flash } })
    },
    [navigate, origin],
  )

  return { origin, returnAfterSave }
}
