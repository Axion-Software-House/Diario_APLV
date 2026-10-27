import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthTemplate } from '@/components/templates/AuthTemplate'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Alert } from '@/components/molecules/Alert'
import { forgotPasswordSchema } from '@/schemas/auth.schema'
import type { ForgotPasswordValues } from '@/schemas/auth.schema'
import { sendPasswordResetEmail } from '@/services/auth'
import styles from './ForgotPassword.module.css'

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordValues) {
    setBusy(true)
    try {
      await sendPasswordResetEmail(values.email.trim())
    } catch {
      // Sempre apresenta a mesma resposta de sucesso, exista a conta ou não,
      // para não revelar quem está cadastrado no sistema (segurança/LGPD).
    } finally {
      setBusy(false)
      setSubmitted(true)
    }
  }

  return (
    <AuthTemplate
      title="Recuperar senha"
      subtitle="Instruções para você redefinir seu acesso com segurança."
      footer={
        !submitted ? (
          <Link to="/login">Lembrou a senha? Entrar</Link>
        ) : undefined
      }
    >
      {submitted ? (
        <div className={styles.successBlock}>
          <Alert variant="info">
            Se este e-mail estiver cadastrado, enviamos as instruções para você redefinir sua
            senha. Verifique sua caixa de entrada e a pasta de spam.
          </Alert>

          <p className={styles.instructions}>
            O link expira em algumas horas. Se não encontrar o e-mail, confira o endereço informado
            ou tente novamente.
          </p>

          <Link to="/login" className={styles.backLink}>
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="E-mail cadastrado"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="seu@email.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" busy={busy} busyLabel="Enviando instruções...">
            Enviar instruções
          </Button>
        </form>
      )}
    </AuthTemplate>
  )
}
