import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthTemplate } from '@/components/templates/AuthTemplate'
import { OnboardingForm } from '@/components/organisms/OnboardingForm'
import { useOnboarding } from '@/hooks/useOnboarding'
import { isCurrentSuperuser } from '@/services/admin'
import type { OnboardingValues } from '@/schemas/onboarding.schema'

export default function Onboarding() {
  const navigate = useNavigate()
  const { state, errorMessage, submit } = useOnboarding()

  // Quem administra o sistema pode não ter criança cadastrada. Sem esta saída,
  // o /admin só era alcançável pelo Perfil, que exige criança.
  const [isSuper, setIsSuper] = useState(false)

  useEffect(() => {
    let active = true
    isCurrentSuperuser()
      .then((allowed) => {
        if (active) setIsSuper(allowed)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(values: OnboardingValues) {
    const ok = await submit({
      childName: values.childName,
      birthDate: values.birthDate || null,
      feeding: values.feeding || null,
      reason: values.reason || null,
      professional: values.professional || null,
    })
    if (ok) navigate('/app', { replace: true })
  }

  return (
    <AuthTemplate
      title="Vamos começar"
      subtitle="Só o essencial para o diário funcionar. Dá para ajustar depois."
      footer={isSuper ? <Link to="/admin">Painel do superusuário</Link> : undefined}
    >
      <OnboardingForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </AuthTemplate>
  )
}
