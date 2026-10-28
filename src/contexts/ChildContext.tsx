import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getActiveChild, getActiveTpo, getPausedTpo } from '@/services/protocols'
import type { ActiveTpo, PausedTpo } from '@/services/protocols'
import type { Child } from '@/types'
import { useAuth } from '@/hooks/useAuth'

type ChildContextValue = {
  /** A criança do usuário. `null` enquanto não passou pelo onboarding. */
  child: Child | null
  /** O TPO em andamento, se houver. A maioria das telas funciona sem ele. */
  activeTpo: ActiveTpo | null
  /**
   * O TPO pausado, quando não há um em andamento e ele é o acompanhamento
   * mais recente. Sempre `null` se `activeTpo` existir.
   */
  pausedTpo: PausedTpo | null
  /** `true` enquanto criança e TPO do usuário atual não foram resolvidos. */
  loading: boolean
  /** Recarrega depois do onboarding, de iniciar, pausar ou retomar um TPO ou mudar de etapa. */
  refresh: () => Promise<void>
}

export const ChildContext = createContext<ChildContextValue | null>(null)

type Resolved = {
  child: Child | null
  activeTpo: ActiveTpo | null
  pausedTpo: PausedTpo | null
}

const EMPTY: Resolved = { child: null, activeTpo: null, pausedTpo: null }

/** O que já foi buscado, e para qual usuário. */
type Snapshot = Resolved & { userId: string | null }

async function fetchFor(userId: string | null): Promise<Resolved> {
  if (!userId) return EMPTY
  try {
    const child = await getActiveChild()
    if (!child) return EMPTY
    const activeTpo = await getActiveTpo(child.id)
    // Só procura o pausado quando não há TPO em andamento: com um ativo, a
    // pausa antiga não tem o que oferecer.
    const pausedTpo = activeTpo ? null : await getPausedTpo(child.id)
    return { child, activeTpo, pausedTpo }
  } catch {
    // Falha de leitura não trava a tela: a rota trata como "sem criança".
    return EMPTY
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
  const pausedTpo = stale ? null : snapshot.pausedTpo

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
    () => ({ child, activeTpo, pausedTpo, loading: authLoading || stale, refresh }),
    [child, activeTpo, pausedTpo, authLoading, stale, refresh],
  )

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>
}
