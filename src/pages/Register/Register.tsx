import { Link, useNavigate } from 'react-router-dom'
import { AuthTemplate } from '@/components/templates/AuthTemplate'
import { AuthForm } from '@/components/organisms/AuthForm'
import { useAuth } from '@/hooks/useAuth'
import { useAuthAction } from '@/hooks/useAuthAction'
import type { SignInValues } from '@/schemas/auth.schema'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { state, errorMessage, run } = useAuthAction(signUp)

  async function handleSubmit(values: SignInValues) {
    if (await run(values)) navigate('/app', { replace: true })
  }

  return (
    <AuthTemplate
      title="Criar conta"
      subtitle="Seus registros ficam visíveis só para você."
      footer={<Link to="/login">Já tem conta? Entrar</Link>}
    >
      <AuthForm mode="signUp" state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </AuthTemplate>
  )
}
