import { Navigate, Outlet } from 'react-router-dom'
import { AuthSplash } from '@/components/templates/AuthTemplate'
import { useChild } from '@/hooks/useChild'

/** Concluído o onboarding, ele não reaparece. */
export function OnboardingRoute() {
  const { child, loading } = useChild()

  if (loading) return <AuthSplash />
  if (child) return <Navigate to="/app" replace />
  return <Outlet />
}
