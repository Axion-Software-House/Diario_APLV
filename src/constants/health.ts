import { Pill, Scale, Stethoscope, Syringe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { HealthKind, HealthRecord } from '@/types'

/** Campos específicos de cada tipo, guardados em `health_records.data` (jsonb). */
export type HealthData = {
  /** medication */
  dose?: string
  /** vaccine */
  reaction?: string
  /** appointment */
  guidance?: string
  questions?: string
  /** weight */
  kg?: number
}

/** Lê `health_records.data` como `HealthData`. */
export function readHealthData(record: HealthRecord): HealthData {
  return (record.data ?? {}) as HealthData
}

/**
 * Os quatro registros de Saúde — README FINAL §12–16. Uma tabela só
 * (`health_records`), com os campos de cada tipo em `data` jsonb.
 *
 * O app apenas registra o que foi informado: não sugere medicamento,
 * dose nem conduta. "Consulta" não é prontuário.
 */
export type HealthKindMeta = {
  value: HealthKind
  label: string
  hint: string
  icon: LucideIcon
}

export const HEALTH_KINDS: readonly HealthKindMeta[] = [
  { value: 'medication', label: 'Medicamento', hint: 'Nome e horário', icon: Pill },
  { value: 'vaccine', label: 'Vacina', hint: 'Nome e data', icon: Syringe },
  { value: 'appointment', label: 'Consulta', hint: 'Orientações e dúvidas', icon: Stethoscope },
  { value: 'weight', label: 'Peso', hint: 'Peso e data', icon: Scale },
] as const

export function healthKindMeta(kind: string): HealthKindMeta | undefined {
  return HEALTH_KINDS.find((item) => item.value === kind)
}
