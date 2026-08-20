import {
  CalendarClock,
  ClipboardList,
  FileText,
  Layers,
  Milk,
  NotebookPen,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Os 8 atalhos da Home — 05-roadmap.md (M4).
 * A ordem é a do roadmap e define a leitura em duas colunas.
 * Qualquer ação principal fica a 1 toque daqui.
 */
export type Shortcut = {
  to: string
  label: string
  hint: string
  icon: LucideIcon
  /** Destaque visual para os registros mais frequentes. */
  emphasis?: true
}

export const SHORTCUTS: readonly Shortcut[] = [
  {
    to: '/app/exposicao',
    label: 'Exposição',
    hint: 'O que foi consumido',
    icon: Milk,
    emphasis: true,
  },
  {
    to: '/app/sintomas',
    label: 'Sintomas',
    hint: 'Marcar por toque',
    icon: Stethoscope,
    emphasis: true,
  },
  {
    to: '/app/sem-sintomas',
    label: 'Sem sintomas',
    hint: 'Registrar que está tudo bem',
    icon: ShieldCheck,
  },
  { to: '/app/fralda', label: 'Fralda', hint: 'Sangue, muco, consistência', icon: ClipboardList },
  { to: '/app/observacao', label: 'Observação', hint: 'Anotação livre', icon: NotebookPen },
  { to: '/app/timeline', label: 'Timeline', hint: 'Tudo em ordem', icon: CalendarClock },
  { to: '/app/etapas', label: 'Etapas', hint: 'Avançar, repetir, retornar', icon: Layers },
  { to: '/app/relatorio', label: 'Relatório', hint: 'Levar à consulta', icon: FileText },
] as const
