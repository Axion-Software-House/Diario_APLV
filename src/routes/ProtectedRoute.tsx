import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loading } from '@/components/atoms/Loading'
import { useAuth } from '@/hooks/useAuth'

/**
 * Bloqueia enquanto a sessão inicial não foi resolvida — sem isso, um F5
 * jogaria a usuária para o login por um instante antes da sessão carregar.
 */
export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading label="Carregando seus dados..." />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
