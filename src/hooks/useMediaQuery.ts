import { useEffect, useState } from 'react'

/**
 * Acompanha uma media query em JS.
 *
 * Serve para NÃO MONTAR o que a tela não vai mostrar: o resumo lateral das
 * telas de registro custa cinco consultas, e no celular — onde o diário é
 * usado — ele nem aparece. Esconder por CSS pagaria a conta à toa.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = (event: MediaQueryListEvent) => setMatches(event.matches)

    // O valor inicial já veio do `useState`; aqui só assinamos a mudança de
    // largura, que é a única coisa que o efeito precisa sincronizar.

    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}
