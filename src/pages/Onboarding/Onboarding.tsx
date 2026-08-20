import { useNavigate } from 'react-router-dom'
import { AuthTemplate } from '@/components/templates/AuthTemplate'
import { OnboardingForm } from '@/components/organisms/OnboardingForm'
import { useOnboarding } from '@/hooks/useOnboarding'
import type { OnboardingValues } from '@/schemas/onboarding.schema'

export default function Onboarding() {
  const navigate = useNavigate()
  const { state, errorMessage, submit } = useOnboarding()

  async function handleSubmit(values: OnboardingValues) {
    const ok = await submit({
      childName: values.childName,
      birthDate: values.birthDate || null,
      feeding: values.feeding || null,
      reason: values.reason || null,
      professional: values.professional || null,
      // O input traz só a data; o banco guarda timestamptz.
      startedAt: new Date(`${values.startedAt}T00:00:00`).toISOString(),
    })
    if (ok) navigate('/app', { replace: true })
  }

  return (
    <AuthTemplate
      title="Vamos começar"
      subtitle="Só o essencial para o diário funcionar. Dá para ajustar depois."
    >
      <OnboardingForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </AuthTemplate>
  )
}
