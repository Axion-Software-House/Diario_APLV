import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getActiveChild, getActiveTpo } from '@/services/protocols'
import type { ActiveTpo } from '@/services/protocols'
import type { Child } from '@/types'
import { useAuth } from '@/hooks/useAuth'

type ChildContextValue = {
  /** A criança do usuário. `null` enquanto não passou pelo onboarding. */
  child: Child | null
  /** O TPO em andamento, se houver. A maioria das telas funciona sem ele. */
  activeTpo: ActiveTpo | null
  /** `true` enquanto criança e TPO do usuário atual não foram resolvidos. */
  loading: boolean
  /** Recarrega depois do onboarding, de iniciar um TPO ou mudar de etapa. */
  refresh: () => Promise<void>
}

export const ChildContext = createContext<ChildContextValue | null>(null)

type Resolved = { child: Child | null; activeTpo: ActiveTpo | null }

/** O que já foi buscado, e para qual usuário. */
type Snapshot = Resolved & { userId: string | null }

async function fetchFor(userId: string | null): Promise<Resolved> {
  if (!userId) return { child: null, activeTpo: null }
  try {
    const child = await getActiveChild()
    if (!child) return { child: null, activeTpo: null }
    const activeTpo = await getActiveTpo(child.id)
    return { child, activeTpo }
  } catch {
    // Falha de leitura não trava a tela: a rota trata como "sem criança".
    return { child: null, activeTpo: null }
  }
}

export function ChildProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)

  const userId = session?.user.id ?? null

  // Derivado na renderização: trocar de usuário invalida o snapshot na hora,
  // sem um render intermediário com dados alheios.
  const stale = snapshot === null || snapshot.userId !== userId
  const child = stale ? null : snapshot.child
  const activeTpo = stale ? null : snapshot.activeTpo

  useEffect(() => {
    if (authLoading || !stale) return
    let cancelled = false
    void fetchFor(userId).then((result) => {
      if (!cancelled) setSnapshot({ userId, ...result })
    })
    return () => {
      cancelled = true
    }
  }, [authLoading, stale, userId])

  const refresh = useCallback(async () => {
    setSnapshot({ userId, ...(await fetchFor(userId)) })
  }, [userId])

  const value = useMemo<ChildContextValue>(
    () => ({ child, activeTpo, loading: authLoading || stale, refresh }),
    [child, activeTpo, authLoading, stale, refresh],
  )

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>
}
