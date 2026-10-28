import {
  HeartPulse,
  MapPin,
  Milk,
  NotebookPen,
  ShieldCheck,
  ShowerHead,
  Stethoscope,
  Utensils,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * As 6 ações principais da Home.
 *
 * Decisão de 2026-10-28: a Home responde a duas perguntas, "o que fazer
 * agora" (estes atalhos) e "como está o acompanhamento" (o resumo no topo:
 * registros de hoje, último peso, tratamento ativo e últimos sintomas, com
 * acesso ao histórico no Diário). O resumo foi pedido no teste com cliente
 * e aprovado pelo João (Tech Lead) no review do PR #20.
 */
export type Shortcut = {
  to: string
  label: string
  hint: string
  emoji: string
  icon?: LucideIcon
  /** Destaque visual para os registros mais frequentes. */
  emphasis?: true
}

export const HOME_ACTIONS: readonly Shortcut[] = [
  {
    to: '/app/alimentacao',
    label: 'Alimentação',
    hint: 'O que a mãe ou a criança consumiu',
    emoji: '🍽️',
    icon: Utensils,
    emphasis: true,
  },
  {
    to: '/app/sintomas',
    label: 'Sintoma',
    hint: 'O que você percebeu',
    emoji: '🩺',
    icon: Stethoscope,
    emphasis: true,
  },
  { to: '/app/fralda', label: 'Fralda', hint: 'Sangue, muco, consistência', emoji: '👶', icon: Milk },
  {
    to: '/app/produto',
    label: 'Produto / Higiene',
    hint: 'Sabonete, hidratante, pomada…',
    emoji: '🧴',
    icon: ShowerHead,
  },
  {
    to: '/app/ambiente',
    label: 'Ambiente / Visita',
    hint: 'Onde vocês estiveram',
    emoji: '📍',
    icon: MapPin,
  },
  { to: '/app/saude', label: 'Saúde', hint: 'Medicamento, vacina, consulta, peso', emoji: '❤️‍🩹', icon: HeartPulse },
] as const

/** Registro de 1 toque da ausência de sintomas (README FINAL §8). */
export const CALM_ACTION: Shortcut = {
  to: '/app/tudo-tranquilo',
  label: 'Tudo tranquilo por aqui',
  hint: 'Registrar que está tudo bem',
  emoji: '🌿',
  icon: ShieldCheck,
}

/** Observação livre — sai da Home, entra pelo Diário (README FINAL §17). */
export const NOTE_ACTION: Shortcut = {
  to: '/app/observacao',
  label: 'Observação',
  hint: 'Algo que não se encaixa nas categorias',
  emoji: '📝',
  icon: NotebookPen,
}

/** Tudo que a folha "+ Novo registro" do Diário oferece. */
export const NEW_RECORD_ACTIONS: readonly Shortcut[] = [
  ...HOME_ACTIONS,
  CALM_ACTION,
  NOTE_ACTION,
] as const
