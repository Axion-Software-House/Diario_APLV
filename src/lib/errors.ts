/**
 * Tradução de erro técnico → mensagem para a usuária.
 *
 * Regra não negociável: nenhuma mensagem do Postgres, do PostgREST ou do
 * GoTrue chega à tela. Tudo passa por aqui.
 */

export type AppErrorKind =
  | 'auth/invalid-credentials'
  | 'auth/email-taken'
  | 'auth/weak-password'
  | 'auth/session-expired'
  | 'network/offline'
  | 'data/not-found'
  | 'data/denied'
  | 'validation'
  | 'unknown'

export class AppError extends Error {
  readonly kind: AppErrorKind
  /** Erro original — só para `console.error` em desenvolvimento. Nunca para a tela. */
  override readonly cause?: unknown

  constructor(kind: AppErrorKind, message: string, cause?: unknown) {
    super(message)
    this.name = 'AppError'
    this.kind = kind
    this.cause = cause
  }

  /** `true` quando a UI deve mandar a usuária para o login. */
  get requiresSignIn(): boolean {
    return this.kind === 'auth/session-expired'
  }
}

const MESSAGES: Record<AppErrorKind, string> = {
  'auth/invalid-credentials': 'E-mail ou senha incorretos.',
  'auth/email-taken': 'Este e-mail já está cadastrado. Tente entrar.',
  'auth/weak-password': 'A senha precisa ter pelo menos 8 caracteres.',
  'auth/session-expired': 'Sua sessão expirou. Entre novamente.',
  'network/offline': 'Sem conexão. Verifique sua internet.',
  'data/not-found': 'Registro não encontrado.',
  'data/denied': 'Não foi possível salvar. Tente novamente.',
  validation: 'Confira os campos destacados.',
  unknown: 'Não foi possível salvar. Tente novamente.',
}

function hasStringProp<K extends string>(value: unknown, key: K): value is Record<K, string> {
  return typeof value === 'object' && value !== null && typeof Reflect.get(value, key) === 'string'
}

function readProp(value: unknown, key: string): string {
  return hasStringProp(value, key) ? Reflect.get(value, key) : ''
}

function classify(error: unknown): AppErrorKind {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'network/offline'
  if (error instanceof TypeError) return 'network/offline'

  const code = readProp(error, 'code')
  const message = readProp(error, 'message').toLowerCase()
  const status = typeof Reflect.get(Object(error), 'status') === 'number' ? Number(Reflect.get(Object(error), 'status')) : 0

  // PostgREST / Postgres
  if (code === '42501') return 'data/denied' // violação de RLS
  if (code === 'PGRST116') return 'data/not-found'
  if (code === '23505') return 'data/denied' // unique
  if (code === '23514' || code === '23503') return 'validation' // check / foreign key

  // GoTrue
  if (status === 401 || message.includes('jwt') || message.includes('session')) {
    return 'auth/session-expired'
  }
  if (message.includes('invalid login')) return 'auth/invalid-credentials'
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'auth/email-taken'
  }
  if (message.includes('password') && message.includes('least')) return 'auth/weak-password'
  if (message.includes('failed to fetch') || message.includes('networkerror')) return 'network/offline'

  return 'unknown'
}

/** Converte qualquer coisa lançada em um `AppError` com mensagem exibível. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error

  const kind = classify(error)
  if (import.meta.env.DEV) console.error('[AppError]', kind, error)
  return new AppError(kind, MESSAGES[kind], error)
}

export function messageFor(kind: AppErrorKind): string {
  return MESSAGES[kind]
}
