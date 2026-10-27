import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loading } from '@/components/atoms/Loading'
import { useAuth } from '@/hooks/useAuth'
import { isCurrentSuperuser } from '@/services/admin'

/**
 * Protege rotas exclusivas de superusuário (ex.: /admin).
 * Redireciona para /app caso o usuário logado não possua o papel superusuário.
 */
export function SuperuserRoute() {
  const { session, loading: authLoading } = useAuth()
  const location = useLocation()
  const [isSuper, setIsSuper] = useState<boolean | null>(null)

  useEffect(() => {
    if (authLoading || !session) return

    let active = true
    isCurrentSuperuser()
      .then((allowed) => {
        if (active) setIsSuper(allowed)
      })
      .catch(() => {
        if (active) setIsSuper(false)
      })

    return () => {
      active = false
    }
  }, [session, authLoading])

  if (authLoading || (session && isSuper === null)) {
    return <Loading label="Verificando permissões administrativas..." />
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isSuper) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
