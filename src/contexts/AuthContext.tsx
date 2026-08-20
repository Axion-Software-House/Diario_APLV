import { createContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import * as authService from '@/services/auth'
import type { Credentials } from '@/services/auth'

type AuthContextValue = {
  session: Session | null
  user: User | null
  /** `true` enquanto a sessão inicial ainda não foi resolvida. */
  loading: boolean
  signUp: (credentials: Credentials) => Promise<void>
  signIn: (credentials: Credentials) => Promise<void>
  signOut: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    // A sessão persistida é lida do storage antes de qualquer rota decidir.
    void authService
      .getSession()
      .then((current) => {
        if (active) setSession(current)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const unsubscribe = authService.onAuthChange((next) => {
      if (active) setSession(next)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signUp: authService.signUp,
      signIn: authService.signIn,
      signOut: authService.signOut,
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
