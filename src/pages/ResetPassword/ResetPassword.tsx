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
import { getSession, isPendingInvite, onAuthChange, updatePassword } from '@/services/auth'
import { toAppError } from '@/lib/errors'
import type { Session } from '@supabase/supabase-js'
import styles from './ResetPassword.module.css'

type PageStatus = 'checking' | 'ready' | 'invalid' | 'success'

/**
 * Quanto esperar o Supabase trocar o token do link por uma sessão. Passado
 * esse tempo sem sessão, o link é tratado como inválido em vez de deixar a
 * tela em "Validando link..." para sempre.
 */
const LINK_TIMEOUT_MS = 10_000

type LinkInfo = {
  /** O próprio Supabase devolveu erro no link (expirado, já usado...). */
  hasError: boolean
  /** O link traz um token que ainda vai virar sessão. */
  hasTokens: boolean
  /**
   * Link de convite do superusuário (`type=invite` no hash). A pessoa ainda não
   * tem senha: a tela é de "Criar sua senha", não de redefinir.
   */
  isInvite: boolean
}

/**
 * Lido uma vez, na montagem: o supabase-js limpa o hash da URL assim que
 * troca o token pela sessão.
 */
function readLink(): LinkInfo {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const search = new URLSearchParams(window.location.search)
  return {
    hasError:
      hash.has('error') || hash.has('error_code') || search.has('error') || search.has('error_code'),
    hasTokens: hash.has('access_token') || search.has('code') || search.has('token_hash'),
    isInvite: hash.get('type') === 'invite' || search.get('type') === 'invite',
  }
}

export default function ResetPassword() {
  const [link] = useState(readLink)
  // Quem abriu o convite e fechou a aba sem criar a senha recebe, no reenvio, um
  // link de recuperação (o GoTrue não reenvia convite para quem já abriu o link).
  // O link não diz `type=invite`, mas a conta diz: a tela continua "Criar sua senha".
  const [inviteFromAccount, setInviteFromAccount] = useState(false)
  const isInvite = link.isInvite || inviteFromAccount
  const [status, setStatus] = useState<PageStatus>(() => (link.hasError ? 'invalid' : 'checking'))
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
    if (link.hasError) return

    let active = true

    // Só sai de 'checking'. Depois de salvar, a sessão continua existindo e
    // não pode trazer o formulário de volta por cima de "Senha redefinida!".
    function resolve(next: 'ready' | 'invalid') {
      if (active) setStatus((current) => (current === 'checking' ? next : current))
    }

    // Só liga: depois de salvar, a conta deixa de estar pendente e a tela de
    // sucesso não pode trocar de "Senha criada!" para "Senha redefinida!".
    function readAccount(session: Session) {
      if (active && isPendingInvite(session.user)) setInviteFromAccount(true)
    }

    // O token do link pode virar sessão depois da montagem: o aviso chega aqui.
    const unsubscribe = onAuthChange((session) => {
      if (!session) return
      readAccount(session)
      resolve('ready')
    })

    getSession()
      .then((session) => {
        if (session) {
          readAccount(session)
          resolve('ready')
        } else if (!link.hasTokens) resolve('invalid')
      })
      .catch(() => resolve('invalid'))

    // Link com token que nunca vira sessão (adulterado, de outro projeto...).
    const timer = link.hasTokens
      ? window.setTimeout(() => resolve('invalid'), LINK_TIMEOUT_MS)
      : undefined

    return () => {
      active = false
      unsubscribe()
      window.clearTimeout(timer)
    }
  }, [link])

  async function onSubmit(values: ResetPasswordValues) {
    setBusy(true)
    setFormError(null)
    try {
      await updatePassword(values.password)
      setStatus('success')
    } catch (err) {
      const appErr = toAppError(err)
      setFormError(
        appErr.message ||
          (isInvite
            ? 'Não foi possível criar sua senha. Tente novamente.'
            : 'Não foi possível redefinir sua senha. Tente novamente.'),
      )
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
        <Loading
          label={
            isInvite ? 'Verificando o convite...' : 'Verificando informações de recuperação...'
          }
        />
      </AuthTemplate>
    )
  }

  if (status === 'invalid') {
    return (
      <AuthTemplate
        title={isInvite ? 'Convite inválido ou expirado' : 'Link inválido ou expirado'}
        subtitle={
          isInvite
            ? 'Não foi possível validar este convite.'
            : 'Não foi possível validar este pedido de redefinição de senha.'
        }
      >
        <div className={styles.resultBlock}>
          <Alert variant="error">
            {isInvite
              ? 'O link do convite pode ter expirado ou já foi utilizado. Peça um novo convite a quem administra o Diário APLV, ou solicite um link com o e-mail convidado.'
              : 'O link de redefinição pode ter expirado ou já foi utilizado. Solicite um novo link para continuar.'}
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
        title={isInvite ? 'Senha criada!' : 'Senha redefinida!'}
        subtitle={
          isInvite
            ? 'Sua senha foi gravada com segurança.'
            : 'Sua nova senha foi gravada com segurança.'
        }
      >
        <div className={styles.resultBlock}>
          <Alert variant="info">
            {isInvite
              ? 'Sua senha foi criada. Você já pode acessar o diário e, nas próximas vezes, entrar com seu e-mail e essa senha.'
              : 'Sua senha foi atualizada com sucesso. Você já pode acessar o diário.'}
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
      title={isInvite ? 'Criar sua senha' : 'Criar nova senha'}
      subtitle={
        isInvite
          ? 'Boas-vindas ao Diário APLV. Escolha a senha que você vai usar para entrar, com pelo menos 8 caracteres.'
          : 'Escolha uma senha segura de pelo menos 8 caracteres para a sua conta.'
      }
    >
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}

        <Input
          label={isInvite ? 'Senha' : 'Nova senha'}
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          hint="Use pelo menos 8 caracteres."
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label={isInvite ? 'Confirmar senha' : 'Confirmar nova senha'}
          type="password"
          autoComplete="new-password"
          placeholder={isInvite ? 'Repita a senha' : 'Repita a nova senha'}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          busy={busy}
          busyLabel={isInvite ? 'Criando sua senha...' : 'Salvando nova senha...'}
        >
          {isInvite ? 'Criar senha' : 'Salvar nova senha'}
        </Button>
      </form>
    </AuthTemplate>
  )
}
