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
import Diario from '@/pages/Diario'
import Diaper from '@/pages/Diaper'
import Note from '@/pages/Note'
import Product from '@/pages/Product'
import Environment from '@/pages/Environment'
import Health from '@/pages/Health'
import HealthEntry from '@/pages/HealthEntry'
import Stages from '@/pages/Stages'
import Tpo from '@/pages/Tpo'
import Learn from '@/pages/Learn'
import LearnTopic from '@/pages/LearnTopic'
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
          {/* Nível 1 — abas da navegação inferior */}
          <Route path="/app" element={<Home />} />
          <Route path="/app/diario" element={<Diario />} />
          <Route path="/app/tpo" element={<Tpo />} />
          <Route path="/app/aprender" element={<Learn />} />

          {/* Nível 2 — telas de registro */}
          <Route path="/app/alimentacao" element={<Exposure />} />
          <Route path="/app/sintomas" element={<Symptoms />} />
          <Route path="/app/tudo-tranquilo" element={<NoSymptoms />} />
          <Route path="/app/fralda" element={<Diaper />} />
          <Route path="/app/produto" element={<Product />} />
          <Route path="/app/ambiente" element={<Environment />} />
          <Route path="/app/saude" element={<Health />} />
          <Route path="/app/saude/:kind" element={<HealthEntry />} />
          <Route path="/app/observacao" element={<Note />} />
          <Route path="/app/aprender/:topic" element={<LearnTopic />} />
          <Route path="/app/tpo/etapas" element={<Stages />} />
          <Route path="/app/relatorio" element={<Report />} />

          {/* Compatibilidade com atalhos salvos (uso controlado, PWA instalado) */}
          <Route path="/app/timeline" element={<Navigate to="/app/diario" replace />} />
          <Route path="/app/etapas" element={<Navigate to="/app/tpo/etapas" replace />} />
          <Route path="/app/exposicao" element={<Navigate to="/app/alimentacao" replace />} />
          <Route path="/app/sem-sintomas" element={<Navigate to="/app/tudo-tranquilo" replace />} />
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
