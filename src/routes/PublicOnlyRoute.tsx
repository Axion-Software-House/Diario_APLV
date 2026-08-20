import { Navigate, Outlet } from 'react-router-dom'
import { Loading } from '@/components/atoms/Loading'
import { useAuth } from '@/hooks/useAuth'

/** Quem já tem sessão não vê login nem cadastro. */
export function PublicOnlyRoute() {
  const { session, loading } = useAuth()

  if (loading) return <Loading />
  if (session) return <Navigate to="/app" replace />
  return <Outlet />
}
