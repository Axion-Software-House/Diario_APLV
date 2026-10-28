import { EMOJI } from '@/constants/emojis'

/**
 * Navegação inferior — README FINAL §3. Quatro áreas, sempre visíveis nas
 * telas de nível 1. As telas de registro (nível 2) abrem sem a barra, com
 * "Voltar".
 */
export type NavTab = {
  to: string
  label: string
  emoji: string
  /** Casa com sub-rotas (`/app/aprender/:topic` ativa "Aprender"). */
  match?: string
}

export const NAV_TABS: readonly NavTab[] = [
  { to: '/app', label: 'Início', emoji: EMOJI.home, match: '/app' },
  { to: '/app/diario', label: 'Diário', emoji: EMOJI.diary, match: '/app/diario' },
  { to: '/app/tpo', label: 'TPO', emoji: EMOJI.tpo, match: '/app/tpo' },
  { to: '/app/aprender', label: 'Aprender', emoji: EMOJI.learn, match: '/app/aprender' },
] as const
