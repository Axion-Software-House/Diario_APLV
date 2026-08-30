import {
  HeartPulse,
  MapPin,
  Milk,
  ShieldCheck,
  ShowerHead,
  Stethoscope,
  Utensils,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * As 6 ações da Home — README FINAL §4. A Home responde só a uma pergunta:
 * "o que você quer registrar agora?". Timeline, Etapas e Relatório saíram
 * daqui (viraram abas / telas internas).
 */
export type Shortcut = {
  to: string
  label: string
  hint: string
  icon: LucideIcon
  /** Destaque visual para os registros mais frequentes. */
  emphasis?: true
}

export const HOME_ACTIONS: readonly Shortcut[] = [
  {
    to: '/app/alimentacao',
    label: 'Alimentação',
    hint: 'O que a mãe ou a criança consumiu',
    icon: Utensils,
    emphasis: true,
  },
  {
    to: '/app/sintomas',
    label: 'Sintoma',
    hint: 'O que você percebeu',
    icon: Stethoscope,
    emphasis: true,
  },
  { to: '/app/fralda', label: 'Fralda', hint: 'Sangue, muco, consistência', icon: Milk },
  {
    to: '/app/produto',
    label: 'Produto / Higiene',
    hint: 'Sabonete, hidratante, pomada…',
    icon: ShowerHead,
  },
  {
    to: '/app/ambiente',
    label: 'Ambiente / Visita',
    hint: 'Onde vocês estiveram',
    icon: MapPin,
  },
  { to: '/app/saude', label: 'Saúde', hint: 'Medicamento, vacina, consulta, peso', icon: HeartPulse },
] as const

/** Registro de 1 toque da ausência de sintomas (README FINAL §8). */
export const CALM_ACTION: Shortcut = {
  to: '/app/tudo-tranquilo',
  label: 'Tudo tranquilo por aqui',
  hint: 'Registrar que está tudo bem',
  icon: ShieldCheck,
}
