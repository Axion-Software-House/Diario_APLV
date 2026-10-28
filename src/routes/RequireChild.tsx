import { Navigate, Outlet } from 'react-router-dom'
import { AuthSplash } from '@/components/templates/AuthTemplate'
import { useChild } from '@/hooks/useChild'

/** Sem criança cadastrada não há diário — manda para o onboarding. */
export function RequireChild() {
  const { child, loading } = useChild()

  if (loading) return <AuthSplash label="Carregando o diário..." />
  if (!child) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
