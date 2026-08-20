import { Navigate, Outlet } from 'react-router-dom'
import { Loading } from '@/components/atoms/Loading'
import { useProtocol } from '@/hooks/useProtocol'

/** Concluído o onboarding, ele não reaparece. */
export function OnboardingRoute() {
  const { active, loading } = useProtocol()

  if (loading) return <Loading />
  if (active) return <Navigate to="/app" replace />
  return <Outlet />
}
