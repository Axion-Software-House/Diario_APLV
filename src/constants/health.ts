import { differenceInCalendarDays, parseISO } from 'date-fns'
import { EMOJI } from '@/constants/emojis'
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
  /** weight — "Peso e medidas": pelo menos um dos três. */
  kg?: number
  /** Comprimento (deitado) ou altura (em pé), em cm. */
  lengthCm?: number
  /** Perímetro cefálico, em cm. */
  headCm?: number
}

/** Lê `health_records.data` como `HealthData`. */
export function readHealthData(record: HealthRecord): HealthData {
  return (record.data ?? {}) as HealthData
}

/** As três medidas de crescimento guardadas em `health_records.data` (kind `weight`). */
export type MeasureKey = 'kg' | 'lengthCm' | 'headCm'

export const MEASURE_KEYS: readonly MeasureKey[] = ['kg', 'lengthCm', 'headCm']

type MeasureSpec = {
  /** Nome no texto das mensagens: "Confira o comprimento: 680 cm?". */
  noun: string
  unit: 'kg' | 'cm'
  min: number
  max: number
}

/**
 * Faixas plausíveis de criança. Não são referência clínica: só barram erro de
 * digitação, como a vírgula esquecida ("785" em vez de "7,85"). A migration
 * `20261024120000_health_weight_range_check.sql` repete as mesmas faixas.
 */
export const MEASURE_SPECS: Readonly<Record<MeasureKey, MeasureSpec>> = {
  kg: { noun: 'o peso', unit: 'kg', min: 0.3, max: 60 },
  lengthCm: { noun: 'o comprimento', unit: 'cm', min: 25, max: 180 },
  headCm: { noun: 'o perímetro cefálico', unit: 'cm', min: 20, max: 65 },
}

/** Faixa plausível de peso infantil (kg) — barra erros de vírgula como "785". */
export const WEIGHT_MIN_KG = MEASURE_SPECS.kg.min
export const WEIGHT_MAX_KG = MEASURE_SPECS.kg.max

/** Variação relativa (20%) a partir da qual o app pede confirmação sem bloquear. */
export const WEIGHT_VARIATION_THRESHOLD = 0.2

/** Número com vírgula decimal, sem unidade: "7,85", "68". */
export function formatMeasureNumber(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

export function formatWeightKg(kg: number): string {
  return formatMeasureNumber(kg)
}

/** Ex.: "7,85 kg" */
export function formatKg(kg: number): string {
  return `${formatWeightKg(kg)} kg`
}

/** "7,85 kg", "68 cm" ou "PC 43 cm" — o perímetro cefálico leva a sigla. */
export function formatMeasure(key: MeasureKey, value: number): string {
  const number = formatMeasureNumber(value)
  if (key === 'kg') return `${number} kg`
  if (key === 'headCm') return `PC ${number} cm`
  return `${number} cm`
}

/** Lê uma medida do jsonb: só conta número finito maior que zero. */
export function readMeasure(data: HealthData, key: MeasureKey): number | null {
  const value = data[key]
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

/** "7,85 kg · 68 cm · PC 43 cm" — só o que o registro tiver. */
export function formatMeasures(data: HealthData): string | undefined {
  const parts = MEASURE_KEYS.flatMap((key) => {
    const value = readMeasure(data, key)
    return value === null ? [] : [formatMeasure(key, value)]
  })
  return parts.length > 0 ? parts.join(' · ') : undefined
}

/** Texto digitado no celular, com vírgula decimal ("7,85"). Vazio vira `NaN`. */
export function parseMeasureInput(raw: string | undefined): number {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return Number.NaN
  return Number(trimmed.replace(',', '.'))
}

export function parseWeightKg(raw: string): number {
  return parseMeasureInput(raw)
}

/**
 * Valida o texto de UMA medida. Vazio é aceito (`null`): as três são
 * opcionais e `validateMeasuresInput` exige pelo menos uma.
 */
export function validateMeasureInput(key: MeasureKey, raw: string | undefined): string | null {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return null
  const spec = MEASURE_SPECS[key]
  const value = parseMeasureInput(trimmed)
  if (!Number.isFinite(value) || value <= 0) return `Informe ${spec.noun} em ${spec.unit}.`
  if (value < spec.min || value > spec.max) {
    return `Confira ${spec.noun}: ${formatMeasureNumber(value)} ${spec.unit}?`
  }
  return null
}

/**
 * Valida o texto digitado no campo de peso. Retorna a mensagem de erro ou
 * `null` quando o valor está na faixa plausível [0,3 kg, 60 kg].
 */
export function validateWeightKg(raw: string): string | null {
  if (!raw.trim()) return 'Informe o peso.'
  return validateMeasureInput('kg', raw)
}

export type MeasuresInput = Partial<Record<MeasureKey, string>>

export const MEASURES_REQUIRED_MESSAGE =
  'Informe pelo menos uma medida: peso, comprimento ou perímetro cefálico.'

/**
 * Valida os três campos de "Peso e medidas". Devolve o erro de cada campo e,
 * quando os três estão vazios, `required` com a mensagem pedindo uma medida.
 */
export function validateMeasuresInput(input: MeasuresInput): {
  fields: Partial<Record<MeasureKey, string>>
  required: string | null
} {
  const fields: Partial<Record<MeasureKey, string>> = {}
  for (const key of MEASURE_KEYS) {
    const error = validateMeasureInput(key, input[key])
    if (error) fields[key] = error
  }
  const anyFilled = MEASURE_KEYS.some((key) => (input[key] ?? '').trim() !== '')
  return { fields, required: anyFilled ? null : MEASURES_REQUIRED_MESSAGE }
}

/** Medidas já validadas, prontas para o jsonb: só as preenchidas entram. */
export function measuresToData(input: MeasuresInput): Pick<HealthData, MeasureKey> {
  const data: Pick<HealthData, MeasureKey> = {}
  for (const key of MEASURE_KEYS) {
    const value = parseMeasureInput(input[key])
    if (Number.isFinite(value) && value > 0) data[key] = value
  }
  return data
}

/** Medida digitada de volta para o campo de texto ("7,85"); vazia quando não há. */
export function measureToInput(data: HealthData, key: MeasureKey): string {
  const value = readMeasure(data, key)
  return value === null ? '' : String(value).replace('.', ',')
}

/** `true` quando a diferença para o último peso registrado é de pelo menos 20%. */
export function hasLargeWeightVariation(
  currentKg: number,
  lastWeightKg: number | null | undefined,
): boolean {
  if (!Number.isFinite(currentKg)) return false
  if (lastWeightKg == null || !Number.isFinite(lastWeightKg) || lastWeightKg <= 0) return false
  return Math.abs(currentKg - lastWeightKg) / lastWeightKg >= WEIGHT_VARIATION_THRESHOLD
}

export type LatestMeasure = {
  value: number
  occurredAt: string
}

/** A última de cada medida — podem vir de registros (e dias) diferentes. */
export type LatestMeasures = Partial<Record<MeasureKey, LatestMeasure>>

/**
 * A medida mais recente de cada tipo (por `occurred_at`). Um registro só com
 * o comprimento não apaga o último peso: cada medida é procurada à parte.
 * Retorna `null` quando não há nenhuma.
 */
export function latestMeasuresFrom(records: readonly HealthRecord[]): LatestMeasures | null {
  const latest: LatestMeasures = {}
  const stamps: Partial<Record<MeasureKey, { time: number; created: number }>> = {}

  for (const record of records) {
    if (record.kind !== 'weight') continue
    const data = readHealthData(record)
    const time = new Date(record.occurred_at).getTime()
    const created = new Date(record.created_at).getTime()
    for (const key of MEASURE_KEYS) {
      const value = readMeasure(data, key)
      if (value === null) continue
      const current = stamps[key]
      // O campo de data não tem segundos: duas medidas no mesmo minuto
      // empatam, e quem corrige um valor logo depois espera ver o que
      // digitou por último.
      if (
        !current ||
        time > current.time ||
        (time === current.time && created > current.created)
      ) {
        stamps[key] = { time, created }
        latest[key] = { value, occurredAt: record.occurred_at }
      }
    }
  }

  return MEASURE_KEYS.some((key) => latest[key]) ? latest : null
}

/**
 * "7,85 kg em 20/10 · 68 cm em 18/10 · PC 43 cm em 18/10" — cada medida
 * com a data dela, porque podem ser de dias diferentes. `formatDate` decide
 * o formato da data (curto no Diário, completo na Home).
 */
export function formatLatestMeasures(
  latest: LatestMeasures,
  formatDate: (iso: string) => string,
): string {
  return MEASURE_KEYS.flatMap((key) => {
    const measure = latest[key]
    return measure ? [`${formatMeasure(key, measure.value)} em ${formatDate(measure.occurredAt)}`] : []
  }).join(' · ')
}

export type LatestWeight = {
  kg: number
  occurredAt: string
}

/** O registro de peso mais recente — base da confirmação de variação de 20%. */
export function latestWeightFrom(records: readonly HealthRecord[]): LatestWeight | null {
  const weight = latestMeasuresFrom(records)?.kg
  return weight ? { kg: weight.value, occurredAt: weight.occurredAt } : null
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
      differenceInCalendarDays(reference, parseISO(record.occurred_at)) + 1,
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
}

export const HEALTH_KINDS: readonly HealthKindMeta[] = [
  { value: 'medication', label: 'Medicamento', hint: 'Tratamentos e doses', emoji: EMOJI.medication },
  { value: 'vaccine', label: 'Vacina', hint: 'Nome e data', emoji: EMOJI.vaccine },
  { value: 'appointment', label: 'Consulta', hint: 'Orientações e dúvidas', emoji: EMOJI.appointment },
  {
    value: 'weight',
    label: 'Peso e medidas',
    hint: 'Peso, comprimento e perímetro cefálico',
    emoji: EMOJI.weight,
  },
] as const

export function healthKindMeta(kind: string): HealthKindMeta | undefined {
  return HEALTH_KINDS.find((item) => item.value === kind)
}
