import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/PublicOnlyRoute'
import { SuperuserRoute } from '@/routes/SuperuserRoute'
import { RequireChild } from '@/routes/RequireChild'
import { OnboardingRoute } from '@/routes/OnboardingRoute'
import Login from '@/pages/Login'
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
import NotFound from '@/pages/NotFound'
import { Loading } from '@/components/atoms/Loading'

// Fora do bundle principal: telas que não entram no registro do dia a dia
// (Relatório, Admin, Aprender, Perfil, cadastro inicial e senha). O bundle
// principal fica com o que a família abre a cada registro. O service worker
// faz precache de todos os chunks, então as rotas lazy abrem offline também.
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const Learn = lazy(() => import('@/pages/Learn'))
const LearnTopic = lazy(() => import('@/pages/LearnTopic'))
const Profile = lazy(() => import('@/pages/Profile'))
const Report = lazy(() => import('@/pages/Report'))
const Admin = lazy(() => import('@/pages/Admin'))

// Catálogo do Design System (M11). Lazy e sob `import.meta.env.DEV`: em
// produção o chunk nunca é pedido, e a família não carrega ferramenta interna.
const Dev = lazy(() => import('@/pages/Dev'))

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route
          path="/recuperar-senha"
          element={
            <Lazy>
              <ForgotPassword />
            </Lazy>
          }
        />
        <Route path="/esqueci-senha" element={<Navigate to="/recuperar-senha" replace />} />
        {/* Cadastro público desativado — redireciona qualquer acesso direto ao login */}
        <Route path="/register" element={<Navigate to="/login" replace />} />
      </Route>

      {/* Redefinição de senha via link enviado por e-mail (possui sessão de recuperação) */}
      <Route
        path="/redefinir-senha"
        element={
          <Lazy>
            <ResetPassword />
          </Lazy>
        }
      />

      <Route element={<ProtectedRoute />}>
        {/* Rota administrativa exclusiva do superusuário (fora do fluxo comum de child) */}
        <Route element={<SuperuserRoute />}>
          <Route
            path="/admin"
            element={
              <Lazy>
                <Admin />
              </Lazy>
            }
          />
        </Route>

        <Route element={<OnboardingRoute />}>
          <Route
            path="/onboarding"
            element={
              <Lazy>
                <Onboarding />
              </Lazy>
            }
          />
        </Route>

        <Route element={<RequireChild />}>
          {/* Nível 1 — abas da navegação inferior */}
          <Route path="/app" element={<Home />} />
          <Route path="/app/diario" element={<Diario />} />
          <Route path="/app/tpo" element={<Tpo />} />
          <Route
            path="/app/aprender"
            element={
              <Lazy>
                <Learn />
              </Lazy>
            }
          />

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
          <Route
            path="/app/aprender/:topic"
            element={
              <Lazy>
                <LearnTopic />
              </Lazy>
            }
          />
          <Route path="/app/tpo/etapas" element={<Stages />} />
          <Route
            path="/app/relatorio"
            element={
              <Lazy>
                <Report />
              </Lazy>
            }
          />
          <Route
            path="/app/perfil"
            element={
              <Lazy>
                <Profile />
              </Lazy>
            }
          />

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
            <Lazy>
              <Dev />
            </Lazy>
          }
        />
      )}

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
