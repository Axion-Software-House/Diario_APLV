import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/PublicOnlyRoute'
import { RequireChild } from '@/routes/RequireChild'
import { OnboardingRoute } from '@/routes/OnboardingRoute'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Onboarding from '@/pages/Onboarding'
import Home from '@/pages/Home'
import Exposure from '@/pages/Exposure'
import Symptoms from '@/pages/Symptoms'
import NoSymptoms from '@/pages/NoSymptoms'
import Timeline from '@/pages/Timeline'
import Diaper from '@/pages/Diaper'
import Note from '@/pages/Note'
import Stages from '@/pages/Stages'
import Report from '@/pages/Report'
import NotFound from '@/pages/NotFound'
import { Loading } from '@/components/atoms/Loading'

// Catálogo do Design System (M11). Lazy e sob `import.meta.env.DEV`: em
// produção o chunk nunca é pedido, e a família não carrega ferramenta interna.
const Dev = lazy(() => import('@/pages/Dev'))

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

        <Route element={<RequireChild />}>
          <Route path="/app" element={<Home />} />
          <Route path="/app/exposicao" element={<Exposure />} />
          <Route path="/app/sintomas" element={<Symptoms />} />
          <Route path="/app/sem-sintomas" element={<NoSymptoms />} />
          <Route path="/app/timeline" element={<Timeline />} />
          <Route path="/app/fralda" element={<Diaper />} />
          <Route path="/app/observacao" element={<Note />} />
          <Route path="/app/etapas" element={<Stages />} />
          <Route path="/app/relatorio" element={<Report />} />
        </Route>
      </Route>

      {import.meta.env.DEV && (
        <Route
          path="/dev"
          element={
            <Suspense fallback={<Loading />}>
              <Dev />
            </Suspense>
          }
        />
      )}

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
