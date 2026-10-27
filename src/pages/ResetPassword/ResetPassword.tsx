import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthTemplate } from '@/components/templates/AuthTemplate'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Alert } from '@/components/molecules/Alert'
import { Loading } from '@/components/atoms/Loading'
import { resetPasswordSchema } from '@/schemas/auth.schema'
import type { ResetPasswordValues } from '@/schemas/auth.schema'
import { getSession, onAuthChange, updatePassword } from '@/services/auth'
import { toAppError } from '@/lib/errors'
import styles from './ResetPassword.module.css'

type PageStatus = 'checking' | 'ready' | 'invalid' | 'success'

function checkInitialStatus(): PageStatus {
  if (typeof window === 'undefined') return 'checking'
  const hash = window.location.hash
  const search = window.location.search
  const hasError =
    hash.includes('error=') ||
    hash.includes('error_code=') ||
    search.includes('error=') ||
    search.includes('error_code=')

  if (hasError) return 'invalid'
  return 'checking'
}

export default function ResetPassword() {
  const [status, setStatus] = useState<PageStatus>(checkInitialStatus)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (status === 'invalid') return

    let isMounted = true

    getSession()
      .then((session) => {
        if (!isMounted) return
        if (session) {
          setStatus('ready')
        } else {
          const hash = window.location.hash
          const search = window.location.search
          const hasTokens = hash.includes('access_token=') || search.includes('code=')
          if (!hasTokens) {
            setStatus('invalid')
          }
        }
      })
      .catch(() => {
        if (isMounted) setStatus('invalid')
      })

    const unsubscribe = onAuthChange((session) => {
      if (!isMounted) return
      if (session) {
        setStatus('ready')
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [status])

  async function onSubmit(values: ResetPasswordValues) {
    setBusy(true)
    setFormError(null)
    try {
      await updatePassword(values.password)
      setStatus('success')
    } catch (err) {
      const appErr = toAppError(err)
      setFormError(appErr.message || 'Não foi possível redefinir sua senha. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'checking') {
    return (
      <AuthTemplate
        title="Validando link..."
        subtitle="Aguarde um instante enquanto verificamos seu acesso."
      >
        <Loading label="Verificando informações de recuperação..." />
      </AuthTemplate>
    )
  }

  if (status === 'invalid') {
    return (
      <AuthTemplate
        title="Link inválido ou expirado"
        subtitle="Não foi possível validar este pedido de redefinição de senha."
      >
        <div className={styles.resultBlock}>
          <Alert variant="error">
            O link de redefinição pode ter expirado ou já foi utilizado. Solicite um novo link para
            continuar.
          </Alert>

          <Link to="/recuperar-senha" className={`${styles.actionLink} ${styles.primaryAction}`}>
            Solicitar novo link
          </Link>

          <Link to="/login" className={`${styles.actionLink} ${styles.secondaryAction}`}>
            Voltar para o login
          </Link>
        </div>
      </AuthTemplate>
    )
  }

  if (status === 'success') {
    return (
      <AuthTemplate
        title="Senha redefinida!"
        subtitle="Sua nova senha foi gravada com segurança."
      >
        <div className={styles.resultBlock}>
          <Alert variant="info">
            Sua senha foi atualizada com sucesso. Você já pode acessar o diário.
          </Alert>

          <Link to="/app" className={`${styles.actionLink} ${styles.primaryAction}`}>
            Acessar o diário
          </Link>

          <Link to="/login" className={`${styles.actionLink} ${styles.secondaryAction}`}>
            Ir para a tela de login
          </Link>
        </div>
      </AuthTemplate>
    )
  }

  return (
    <AuthTemplate
      title="Criar nova senha"
      subtitle="Escolha uma senha segura de pelo menos 8 caracteres para a sua conta."
    >
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}

        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          hint="Use pelo menos 8 caracteres."
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a nova senha"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" busy={busy} busyLabel="Salvando nova senha...">
          Salvar nova senha
        </Button>
      </form>
    </AuthTemplate>
  )
}
