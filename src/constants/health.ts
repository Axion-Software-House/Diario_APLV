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

/** Faixa plausível de peso infantil (kg) — barra erros de vírgula como "785". */
export const WEIGHT_MIN_KG = 0.3
export const WEIGHT_MAX_KG = 60

/** Variação relativa (20%) a partir da qual o app pede confirmação sem bloquear. */
export const WEIGHT_VARIATION_THRESHOLD = 0.2

export function formatWeightKg(kg: number): string {
  return kg.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

export function parseWeightKg(raw: string): number {
  return Number(raw.trim().replace(',', '.'))
}

/**
 * Valida o texto digitado no campo de peso. Retorna a mensagem de erro ou
 * `null` quando o valor está na faixa plausível [0,3 kg, 60 kg].
 */
export function validateWeightKg(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return 'Informe o peso.'
  const value = parseWeightKg(trimmed)
  if (!Number.isFinite(value) || value <= 0) return 'Informe o peso.'
  if (value < WEIGHT_MIN_KG || value > WEIGHT_MAX_KG) {
    return `Confira o peso: ${formatWeightKg(value)} kg?`
  }
  return null
}

/** `true` quando a diferença para o último peso registrado é de pelo menos 20%. */
export function hasLargeWeightVariation(
  currentKg: number,
  lastWeightKg: number | null | undefined,
): boolean {
  if (lastWeightKg == null || !Number.isFinite(lastWeightKg) || lastWeightKg <= 0) return false
  return Math.abs(currentKg - lastWeightKg) / lastWeightKg >= WEIGHT_VARIATION_THRESHOLD
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
