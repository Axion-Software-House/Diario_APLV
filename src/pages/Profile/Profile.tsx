import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LogOut, Shield } from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { Card } from '@/components/molecules/Card'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { Toast } from '@/components/molecules/Toast'
import { FEEDING_OPTIONS } from '@/constants/feeding'
import { useAuth } from '@/hooks/useAuth'
import { useAuthAction } from '@/hooks/useAuthAction'
import { useChild } from '@/hooks/useChild'
import { useEntryMutation } from '@/hooks/useEntryMutation'
import { resetPasswordSchema } from '@/schemas/auth.schema'
import { onboardingSchema } from '@/schemas/onboarding.schema'
import type { OnboardingValues } from '@/schemas/onboarding.schema'
import { updatePassword } from '@/services/auth'
import { updateChild } from '@/services/protocols'
import { isCurrentSuperuser } from '@/services/admin'
import styles from './Profile.module.css'

const FEEDING_CHIPS = FEEDING_OPTIONS.map((o) => ({ value: o.code, label: o.label }))

export default function Profile() {
  const { user, signOut } = useAuth()
  const { child, refresh } = useChild()
  const childMutation = useEntryMutation()
  const passwordMutation = useEntryMutation()
  const { state: signOutState, run: runSignOut } = useAuthAction(signOut)

  const [toastMessage, setToastMessage] = useState<string>()
  const [isSuper, setIsSuper] = useState(false)

  useEffect(() => {
    isCurrentSuperuser().then(setIsSuper).catch(() => {})
  }, [])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      childName: child?.name ?? '',
      birthDate: child?.birth_date ?? '',
      feeding: child?.feeding ?? '',
      reason: child?.reason ?? '',
      professional: child?.professional ?? '',
    },
  })

  if (!child) return null

  const currentChild = child

  async function onSubmitChild(values: OnboardingValues) {
    const ok = await childMutation.run(async () => {
      await updateChild(currentChild.id, {
        childName: values.childName,
        birthDate: values.birthDate || null,
        feeding: values.feeding || null,
        reason: values.reason || null,
        professional: values.professional || null,
      })
      await refresh()
    })
    if (ok) {
      setToastMessage('Dados da criança salvos.')
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault()
    // Mesma regra da tela de redefinição: 8+ caracteres e confirmação igual.
    // Um erro de digitação aqui trancaria a pessoa fora da própria conta.
    const parsed = resetPasswordSchema.safeParse({ password: newPassword, confirmPassword })
    if (!parsed.success) {
      const next: { password?: string; confirmPassword?: string } = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if ((field === 'password' || field === 'confirmPassword') && !next[field]) {
          next[field] = issue.message
        }
      }
      setPasswordErrors(next)
      return
    }
    setPasswordErrors({})
    const ok = await passwordMutation.run(() => updatePassword(newPassword))
    if (ok) {
      setNewPassword('')
      setConfirmPassword('')
      setToastMessage('Senha atualizada.')
    }
  }

  return (
    <AppTemplate
      title="Perfil"
      subtitle="Dados da criança, acompanhamento e conta."
      backTo="/app"
    >
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(undefined)} />
      )}

      <Card as="section" className={styles.section} aria-label="Dados da criança">
        <form className={styles.form} onSubmit={handleSubmit(onSubmitChild)} noValidate>
          <fieldset className={styles.group}>
            <legend className={styles.groupTitle}>A criança</legend>
            <Input
              label="Nome ou apelido"
              autoComplete="off"
              error={errors.childName?.message}
              {...register('childName')}
            />
            <Input
              label="Data de nascimento (opcional)"
              type="date"
              error={errors.birthDate?.message}
              {...register('birthDate')}
            />
            <Controller
              control={control}
              name="feeding"
              render={({ field }) => (
                <ChipGroup
                  legend="Alimentação atual (opcional)"
                  options={FEEDING_CHIPS}
                  value={field.value || null}
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.groupTitle}>O acompanhamento</legend>
            <Textarea
              label="Motivo (opcional)"
              hint="O que levou a família a começar o acompanhamento."
              error={errors.reason?.message}
              {...register('reason')}
            />
            <Input
              label="Profissional de saúde (opcional)"
              autoComplete="off"
              error={errors.professional?.message}
              {...register('professional')}
            />
          </fieldset>

          <div aria-live="polite">
            {childMutation.state === 'error' && childMutation.errorMessage && (
              <Alert variant="error">{childMutation.errorMessage}</Alert>
            )}
          </div>

          <Button
            type="submit"
            busy={childMutation.state === 'saving'}
            busyLabel="Salvando..."
          >
            Salvar dados da criança
          </Button>
        </form>
      </Card>

      <Card as="section" className={styles.section} aria-label="Conta">
        <h2 className={styles.sectionTitle}>Conta</h2>
        <div className={styles.accountEmail}>
          <span className={styles.accountLabel}>E-mail</span>
          <strong className={styles.accountValue}>{user?.email ?? '—'}</strong>
        </div>

        <form className={styles.passwordForm} onSubmit={(e) => void handlePasswordSubmit(e)} noValidate>
          <Input
            label="Alterar senha"
            type="password"
            autoComplete="new-password"
            hint="Pelo menos 8 caracteres."
            value={newPassword}
            error={passwordErrors.password}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setPasswordErrors((current) => ({ ...current, password: undefined }))
            }}
          />

          <Input
            label="Confirmar nova senha"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            error={passwordErrors.confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setPasswordErrors((current) => ({ ...current, confirmPassword: undefined }))
            }}
          />

          <div aria-live="polite">
            {passwordMutation.state === 'error' && passwordMutation.errorMessage && (
              <Alert variant="error">{passwordMutation.errorMessage}</Alert>
            )}
          </div>

          <Button
            type="submit"
            variant="secondary"
            busy={passwordMutation.state === 'saving'}
            busyLabel="Alterando..."
          >
            Salvar nova senha
          </Button>
        </form>
      </Card>

      {isSuper && (
        <Card as="section" className={styles.section} aria-label="Administração do sistema">
          <h2 className={styles.sectionTitle}>Administração</h2>
          <p className={styles.sectionDesc}>
            Você possui privilégios de superusuário para gerenciar acessos e permissões do sistema.
          </p>
          <div>
            <Link to="/admin" className={styles.adminLink}>
              <Shield size={18} aria-hidden="true" />
              <span>Painel do Superusuário</span>
            </Link>
          </div>
        </Card>
      )}

      <div className={styles.signOutBlock}>
        <Button
          variant="ghost"
          busy={signOutState === 'saving'}
          busyLabel="Saindo..."
          onClick={() => void runSignOut(undefined)}
        >
          <LogOut size={18} aria-hidden="true" />
          Sair da conta
        </Button>
      </div>
    </AppTemplate>
  )
}
