import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { signInSchema, signUpSchema } from '@/schemas/auth.schema'
import type { SignInValues } from '@/schemas/auth.schema'
import type { ActionState } from '@/types'
import styles from './AuthForm.module.css'

type Props = {
  mode: 'signIn' | 'signUp'
  state: ActionState
  errorMessage?: string
  onSubmit: (values: SignInValues) => void
}

export function AuthForm({ mode, state, errorMessage, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(mode === 'signIn' ? signInSchema : signUpSchema),
    defaultValues: { email: '', password: '' },
  })

  const busy = state === 'saving'

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Senha"
        type="password"
        autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
        error={errors.password?.message}
        {...register('password')}
      />

      {/* aria-live: o leitor de tela anuncia a falha sem precisar procurar. */}
      <div aria-live="polite">
        {state === 'error' && errorMessage && <p className={styles.error}>{errorMessage}</p>}
      </div>

      <Button
        type="submit"
        busy={busy}
        busyLabel={mode === 'signIn' ? 'Entrando...' : 'Criando...'}
      >
        {mode === 'signIn' ? 'Entrar' : 'Criar conta'}
      </Button>
    </form>
  )
}
