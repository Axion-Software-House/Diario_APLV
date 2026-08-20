import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getActiveProtocol } from '@/services/protocols'
import type { ActiveProtocol } from '@/services/protocols'
import { useAuth } from '@/hooks/useAuth'

type ProtocolContextValue = {
  active: ActiveProtocol | null
  /** `true` enquanto o acompanhamento ativo do usuário atual não foi resolvido. */
  loading: boolean
  /** Recarrega depois do onboarding ou de uma mudança de etapa. */
  refresh: () => Promise<void>
}

export const ProtocolContext = createContext<ProtocolContextValue | null>(null)

/** O que já foi buscado, e para qual usuário. */
type Snapshot = { userId: string | null; active: ActiveProtocol | null }

async function fetchFor(userId: string | null): Promise<ActiveProtocol | null> {
  if (!userId) return null
  try {
    return await getActiveProtocol()
  } catch {
    // Falha de leitura não trava a tela: a rota trata como "sem acompanhamento".
    return null
  }
}

export function ProtocolProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)

  const userId = session?.user.id ?? null

  // Derivado na renderização, não sincronizado por efeito: trocar de usuário
  // invalida o snapshot na hora, sem um render intermediário com dados alheios.
  const stale = snapshot === null || snapshot.userId !== userId
  const active = stale ? null : snapshot.active

  useEffect(() => {
    if (authLoading || !stale) return
    let cancelled = false
    void fetchFor(userId).then((result) => {
      if (!cancelled) setSnapshot({ userId, active: result })
    })
    return () => {
      cancelled = true
    }
  }, [authLoading, stale, userId])

  const refresh = useCallback(async () => {
    setSnapshot({ userId, active: await fetchFor(userId) })
  }, [userId])

  const value = useMemo<ProtocolContextValue>(
    () => ({ active, loading: authLoading || stale, refresh }),
    [active, authLoading, stale, refresh],
  )

  return <ProtocolContext.Provider value={value}>{children}</ProtocolContext.Provider>
}
