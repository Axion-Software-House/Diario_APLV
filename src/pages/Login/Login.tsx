import { Link, useNavigate } from 'react-router-dom'
import { AuthTemplate } from '@/components/templates/AuthTemplate'
import { AuthForm } from '@/components/organisms/AuthForm'
import { useAuth } from '@/hooks/useAuth'
import { useAuthAction } from '@/hooks/useAuthAction'
import type { SignInValues } from '@/schemas/auth.schema'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { state, errorMessage, run } = useAuthAction(signIn)

  async function handleSubmit(values: SignInValues) {
    if (await run(values)) navigate('/app', { replace: true })
  }

  return (
    <AuthTemplate
      title="Entrar"
      subtitle="Acompanhamento simples, registro seguro."
      footer={<Link to="/register">Ainda não tem conta? Criar conta</Link>}
    >
      <AuthForm mode="signIn" state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </AuthTemplate>
  )
}
