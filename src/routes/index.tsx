import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/PublicOnlyRoute'
import { RequireProtocol } from '@/routes/RequireProtocol'
import { OnboardingRoute } from '@/routes/OnboardingRoute'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Onboarding from '@/pages/Onboarding'
import Home from '@/pages/Home'
import Exposure from '@/pages/Exposure'
import Symptoms from '@/pages/Symptoms'
import NoSymptoms from '@/pages/NoSymptoms'
import ComingSoon from '@/pages/ComingSoon'
import NotFound from '@/pages/NotFound'

/** Telas ainda não construídas — cada uma cai no seu módulo (ver 05-roadmap.md). */
const PENDING = [
  { path: '/app/timeline', title: 'Timeline', module: 'M7' },
  { path: '/app/fralda', title: 'Fralda', module: 'M8' },
  { path: '/app/observacao', title: 'Observação', module: 'M8' },
  { path: '/app/etapas', title: 'Etapas', module: 'M9' },
  { path: '/app/relatorio', title: 'Relatório', module: 'M10' },
] as const

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<OnboardingRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>

        <Route element={<RequireProtocol />}>
          <Route path="/app" element={<Home />} />
          <Route path="/app/exposicao" element={<Exposure />} />
          <Route path="/app/sintomas" element={<Symptoms />} />
          <Route path="/app/sem-sintomas" element={<NoSymptoms />} />
          {PENDING.map((screen) => (
            <Route
              key={screen.path}
              path={screen.path}
              element={<ComingSoon title={screen.title} module={screen.module} />}
            />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
