import { Navigate, Outlet } from 'react-router-dom'
import { Loading } from '@/components/atoms/Loading'
import { useProtocol } from '@/hooks/useProtocol'

/** Sem acompanhamento ativo não há o que registrar — manda para o onboarding. */
export function RequireProtocol() {
  const { active, loading } = useProtocol()

  if (loading) return <Loading label="Carregando o acompanhamento..." />
  if (!active) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
