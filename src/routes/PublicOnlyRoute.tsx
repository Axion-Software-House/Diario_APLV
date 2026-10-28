import { Navigate, Outlet } from 'react-router-dom'
import { AuthSplash } from '@/components/templates/AuthTemplate'
import { useAuth } from '@/hooks/useAuth'

/** Quem já tem sessão não vê login nem cadastro. */
export function PublicOnlyRoute() {
  const { session, loading } = useAuth()

  if (loading) return <AuthSplash />
  if (session) return <Navigate to="/app" replace />
  return <Outlet />
}
