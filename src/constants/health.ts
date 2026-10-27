import { differenceInCalendarDays } from 'date-fns'
import { Pill, Scale, Stethoscope, Syringe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { HealthKind, HealthRecord } from '@/types'

export type MedicationEntryType = 'treatment' | 'dose' | 'single'
export type MedicationDurationMode = 'days' | 'continuous'

/** Campos específicos de cada tipo, guardados em `health_records.data` (jsonb). */
export type HealthData = {
  /** medication */
  entryType?: MedicationEntryType
  dose?: string
  intervalHours?: number
  durationMode?: MedicationDurationMode
  durationDays?: number
  endedAt?: string
  treatmentId?: string
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

export type LatestWeight = {
  kg: number
  occurredAt: string
}

/** Encontra o registro de peso mais recente (por `occurred_at`). */
export function latestWeightFrom(records: readonly HealthRecord[]): LatestWeight | null {
  let latest: LatestWeight | null = null
  let latestTime = -Infinity

  for (const record of records) {
    if (record.kind !== 'weight') continue
    const { kg } = readHealthData(record)
    if (typeof kg !== 'number' || Number.isNaN(kg) || kg <= 0) continue
    const time = new Date(record.occurred_at).getTime()
    if (time > latestTime) {
      latestTime = time
      latest = { kg, occurredAt: record.occurred_at }
    }
  }

  return latest
}

/** Ex.: "7,85 kg" */
export function formatKg(kg: number): string {
  return `${kg.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg`
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

export const MEDICATION_ENTRY_MODES = [
  { value: 'treatment', label: 'Novo tratamento' },
  { value: 'single', label: 'Dose avulsa' },
] as const

export const MEDICATION_INTERVAL_OPTIONS = [
  { value: '3', label: 'De 3 em 3h', hours: 3 },
  { value: '4', label: 'De 4 em 4h', hours: 4 },
  { value: '6', label: 'De 6 em 6h', hours: 6 },
  { value: '8', label: 'De 8 em 8h', hours: 8 },
  { value: '12', label: 'De 12 em 12h', hours: 12 },
  { value: '24', label: 'De 24 em 24h', hours: 24 },
  { value: 'custom', label: 'Outro intervalo', hours: null },
] as const

export const MEDICATION_DURATION_OPTIONS = [
  { value: 'days', label: 'Por alguns dias' },
  { value: 'continuous', label: 'Uso contínuo' },
] as const

export function formatMedicationInterval(hours?: number): string | undefined {
  if (typeof hours !== 'number' || Number.isNaN(hours) || hours <= 0) return undefined
  return hours === 1 ? 'de 1 em 1 hora' : `de ${hours} em ${hours} horas`
}

export function formatMedicationDuration(data: HealthData): string | undefined {
  if (data.durationMode === 'continuous') return 'uso contínuo'
  if (
    data.durationMode === 'days' &&
    typeof data.durationDays === 'number' &&
    data.durationDays > 0
  ) {
    return data.durationDays === 1 ? 'por 1 dia' : `por ${data.durationDays} dias`
  }
  return undefined
}

export function describeMedicationSchedule(data: HealthData): string | undefined {
  const parts = [
    data.dose ? `Dose: ${data.dose}` : undefined,
    formatMedicationInterval(data.intervalHours),
    formatMedicationDuration(data),
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

export type ActiveMedicationTreatment = {
  record: HealthRecord
  name: string
  dose: string | null
  intervalHours: number | null
  durationMode: MedicationDurationMode
  durationDays: number | null
  startedAt: string
  currentDay: number
  statusLabel: string
  scheduleLabel: string
  doseCount: number
  lastDoseAt: string | null
}

/**
 * Filtra os tratamentos ativos da criança a partir dos registros de saúde.
 * Um tratamento permanece ativo enquanto não tiver `endedAt` e, quando
 * prescrito por dias, enquanto o dia corrente não ultrapassar `durationDays`.
 */
export function listActiveTreatments(
  healthRecords: readonly HealthRecord[],
  reference: Date = new Date(),
): ActiveMedicationTreatment[] {
  const medications = healthRecords.filter((item) => item.kind === 'medication')
  const dosesByTreatment = new Map<string, HealthRecord[]>()

  for (const item of medications) {
    const data = readHealthData(item)
    if (data.entryType === 'dose' && data.treatmentId) {
      const list = dosesByTreatment.get(data.treatmentId) ?? []
      list.push(item)
      dosesByTreatment.set(data.treatmentId, list)
    }
  }

  const active: ActiveMedicationTreatment[] = []

  for (const record of medications) {
    const data = readHealthData(record)
    if (data.entryType !== 'treatment' || data.endedAt) continue

    const currentDay = Math.max(
      1,
      differenceInCalendarDays(reference, new Date(record.occurred_at)) + 1,
    )
    const durationMode: MedicationDurationMode =
      data.durationMode === 'continuous' ? 'continuous' : 'days'
    const durationDays =
      durationMode === 'days' && typeof data.durationDays === 'number' && data.durationDays > 0
        ? data.durationDays
        : null

    if (durationMode === 'days' && durationDays !== null && currentDay > durationDays) {
      continue
    }

    const doses = (dosesByTreatment.get(record.id) ?? []).toSorted(
      (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    )

    const statusLabel =
      durationMode === 'continuous'
        ? 'Uso contínuo'
        : durationDays !== null
          ? `Dia ${currentDay} de ${durationDays}`
          : `Dia ${currentDay}`

    const scheduleLabel =
      [
        data.dose ?? undefined,
        formatMedicationInterval(data.intervalHours),
        formatMedicationDuration(data),
      ]
        .filter(Boolean)
        .join(' · ') || 'Tratamento em andamento'

    active.push({
      record,
      name: record.title ?? 'Medicamento',
      dose: data.dose ?? null,
      intervalHours: typeof data.intervalHours === 'number' ? data.intervalHours : null,
      durationMode,
      durationDays,
      startedAt: record.occurred_at,
      currentDay,
      statusLabel,
      scheduleLabel,
      doseCount: doses.length,
      lastDoseAt: doses[0]?.occurred_at ?? null,
    })
  }

  return active.toSorted(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )
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
  emoji: string
  icon?: LucideIcon
}

export const HEALTH_KINDS: readonly HealthKindMeta[] = [
  { value: 'medication', label: 'Medicamento', hint: 'Tratamentos e doses', emoji: '💊', icon: Pill },
  { value: 'vaccine', label: 'Vacina', hint: 'Nome e data', emoji: '💉', icon: Syringe },
  { value: 'appointment', label: 'Consulta', hint: 'Orientações e dúvidas', emoji: '🩺', icon: Stethoscope },
  { value: 'weight', label: 'Peso', hint: 'Peso e data', emoji: '⚖️', icon: Scale },
] as const

export function healthKindMeta(kind: string): HealthKindMeta | undefined {
  return HEALTH_KINDS.find((item) => item.value === kind)
}
