import { Navigate, Outlet } from 'react-router-dom'
import { Loading } from '@/components/atoms/Loading'
import { useChild } from '@/hooks/useChild'

/** Concluído o onboarding, ele não reaparece. */
export function OnboardingRoute() {
  const { child, loading } = useChild()

  if (loading) return <Loading />
  if (child) return <Navigate to="/app" replace />
  return <Outlet />
}
