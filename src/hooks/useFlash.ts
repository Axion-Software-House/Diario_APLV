import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function readFlash(state: unknown): string | undefined {
  if (typeof state !== 'object' || state === null) return undefined
  const flash = Reflect.get(state, 'flash')
  return typeof flash === 'string' ? flash : undefined
}

/**
 * Confirmação trazida pela navegação — a tela que salvou manda a mensagem,
 * a tela que recebe mostra.
 *
 * A mensagem é lida uma vez, na montagem, e o state da rota é limpo em
 * seguida: assim um refresh ou um "voltar" não repete a confirmação de um
 * registro antigo, e a limpeza não derruba o aviso que já está na tela.
 */
export function useFlash(): string | undefined {
  const location = useLocation()
  const navigate = useNavigate()
  const [message] = useState(() => readFlash(location.state))

  useEffect(() => {
    if (!message) return
    navigate(location.pathname, { replace: true, state: null })
  }, [message, location.pathname, navigate])

  return message
}
