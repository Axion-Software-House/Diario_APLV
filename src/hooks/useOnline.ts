import { useEffect, useState } from 'react'

/**
 * Estado de conexão do navegador.
 *
 * O diário não guarda registro em fila offline de propósito: um evento
 * clínico que "salvou" no aparelho e nunca chegou ao banco é pior do que um
 * que a família sabe que precisa registrar de novo. Aqui o app avisa.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}
