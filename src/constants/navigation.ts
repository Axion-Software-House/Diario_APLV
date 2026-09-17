import { BookOpen, CalendarHeart, House, Sprout } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Navegação inferior — README FINAL §3. Quatro áreas, sempre visíveis nas
 * telas de nível 1. As telas de registro (nível 2) abrem sem a barra, com
 * "Voltar".
 */
export type NavTab = {
  to: string
  label: string
  icon: LucideIcon
  /** Casa com sub-rotas (`/app/diario/novo` ativa "Diário"). */
  match?: string
}

export const NAV_TABS: readonly NavTab[] = [
  { to: '/app', label: 'Início', icon: House, match: '/app' },
  { to: '/app/diario', label: 'Diário', icon: CalendarHeart, match: '/app/diario' },
  { to: '/app/tpo', label: 'TPO', icon: Sprout, match: '/app/tpo' },
  { to: '/app/aprender', label: 'Aprender', icon: BookOpen, match: '/app/aprender' },
] as const
