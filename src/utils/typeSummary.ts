import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DIAPER_CONSISTENCY } from '@/constants/diaper'
import { ENVIRONMENT_PLACE_LABELS } from '@/constants/environments'
import { EXPOSURE_DAIRY_OPTIONS } from '@/constants/exposure'
import { PRODUCT_CATEGORY_LABELS } from '@/constants/products'
import { INTENSITIES, SYMPTOM_EVOLUTION_LABELS, SYMPTOMS } from '@/constants/symptoms'
import { toDateValue } from '@/utils/dates'
import { daysOfPeriods } from '@/utils/report'
import { buildTimeline } from '@/utils/timeline'
import type { TimelineSources } from '@/utils/timeline'
import type { StageHistory, SymptomEventWithItems, TimelineKind } from '@/types'

/**
 * Resumos descritivos de cada tela de registro (alimentação, sintomas, tudo
 * tranquilo, fralda, produto, ambiente e observação).
 *
 * Regra de produto: cada resumo olha para UM tipo de registro. Nada aqui
 * cruza alimentação com sintoma nem sugere relação entre registros — são
 * contagens e listas do que a família anotou. Funções puras, para a Home
 * reutilizar na fase 2 e para teste fora do React.
 *
 * Só fazem sentido com o diário carregado: com `sources` vazio por
 * carregamento ou erro, "0 registros" seria afirmação falsa. Quem chama
 * confere `loading` e `errorMessage` antes (como a Home).
 */

/** Tipos com tela de registro própria — Saúde e TPO têm painéis à parte. */
export type SummaryKind = Extract<
  TimelineKind,
  'exposure' | 'symptom' | 'no_symptoms' | 'diaper' | 'product' | 'environment' | 'note'
>

/** Quantos dias entram em "últimos 7 dias" (hoje incluído). */
export const WEEK = 7
/** Janela maior, usada em "Tudo tranquilo". */
export const FORTNIGHT = 14

export type TypeCounts = {
  today: number
  last7: number
  total: number
}

/** Um dia da faixa: chave local yyyy-MM-dd, rótulos e a contagem do tipo. */
export type DayCount = {
  key: string
  /** Dia do mês, ex.: "26". */
  dayLabel: string
  /** Ex.: "segunda-feira, 26/10" — para leitor de tela e dica ao passar o mouse. */
  fullLabel: string
  isToday: boolean
  count: number
}

export type LatestRecord = {
  occurredAt: string
  title: string
  detail?: string
}

/** Item de lista em barras: rótulo e quantidade. `key` é estável por entidade. */
export type RankItem = {
  key: string
  label: string
  value: number
  emoji?: string
}

/**
 * Parte de um todo de um tipo só (barra empilhada). `tone` fixa a cor por
 * entidade — a mesma opção tem sempre a mesma cor, tenha ou não registros.
 */
export type StackPart = {
  key: string
  label: string
  value: number
  tone: ChartTone
}

export type ChartTone = 'chart1' | 'chart2' | 'chart3' | 'chart4' | 'neutral' | 'neutralSoft'

export type BaseSummary = {
  counts: TypeCounts
  days: DayCount[]
  latest: LatestRecord | null
}

// ── utilidades ──────────────────────────────────────────────────────────

/** Texto curto para listas: corta na palavra e acrescenta reticências. */
export function truncateText(text: string, max = 80): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/** Chaves yyyy-MM-dd dos últimos `days` dias, do mais antigo para hoje. */
export function lastDayKeys(reference: Date, days: number): string[] {
  return Array.from({ length: days }, (_, index) =>
    toDateValue(subDays(reference, days - 1 - index)),
  )
}

function isAfter(stamp: string, reference: Date): boolean {
  return new Date(stamp).getTime() > reference.getTime()
}

/** Hoje, últimos 7 dias (calendário, hoje incluído) e total. */
export function countRecords(stamps: readonly string[], reference: Date): TypeCounts {
  const todayKey = toDateValue(reference)
  const week = new Set(lastDayKeys(reference, WEEK))
  let today = 0
  let last7 = 0
  for (const stamp of stamps) {
    const key = toDateValue(stamp)
    if (key === todayKey) today += 1
    if (week.has(key)) last7 += 1
  }
  return { today, last7, total: stamps.length }
}

/** Contagem por dia nos últimos `days` dias — a faixa da semana. */
export function countByDay(
  stamps: readonly string[],
  reference: Date,
  days: number = WEEK,
): DayCount[] {
  const perDay = new Map<string, number>()
  for (const stamp of stamps) {
    const key = toDateValue(stamp)
    perDay.set(key, (perDay.get(key) ?? 0) + 1)
  }
  const todayKey = toDateValue(reference)
  return Array.from({ length: days }, (_, index) => {
    const date = subDays(reference, days - 1 - index)
    const key = toDateValue(date)
    return {
      key,
      dayLabel: format(date, 'd'),
      fullLabel: format(date, 'EEEE, dd/MM', { locale: ptBR }),
      isToday: key === todayKey,
      count: perDay.get(key) ?? 0,
    }
  })
}

/** Quantos dos últimos `days` dias têm pelo menos um registro. */
export function daysWithRecords(stamps: readonly string[], reference: Date, days: number): number {
  const window = new Set(lastDayKeys(reference, days))
  return new Set(stamps.map((stamp) => toDateValue(stamp)).filter((key) => window.has(key))).size
}

/** Só os registros dos últimos 7 dias (calendário, hoje incluído). */
function inLastWeek<T extends { occurred_at: string }>(items: readonly T[], reference: Date): T[] {
  const week = new Set(lastDayKeys(reference, WEEK))
  return items.filter((item) => week.has(toDateValue(item.occurred_at)))
}

function byMostRecent(a: { occurred_at: string }, b: { occurred_at: string }): number {
  return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
}

/** Os registros já acontecidos, do mais recente para o mais antigo. */
function recentFirst<T extends { occurred_at: string }>(items: readonly T[], reference: Date): T[] {
  return items.filter((item) => !isAfter(item.occurred_at, reference)).toSorted(byMostRecent)
}

/** Ranking por chave, com o rótulo do registro mais recente de cada chave. */
function rank<T extends { occurred_at: string }>(
  items: readonly T[],
  keyOf: (item: T) => string | null,
  labelOf: (item: T) => string,
  limit: number,
): RankItem[] {
  const groups = new Map<string, { label: string; value: number; latest: number }>()
  for (const item of items) {
    const key = keyOf(item)
    if (!key) continue
    const time = new Date(item.occurred_at).getTime()
    const group = groups.get(key)
    if (group) {
      group.value += 1
      if (time > group.latest) {
        group.latest = time
        group.label = labelOf(item)
      }
    } else {
      groups.set(key, { label: labelOf(item), value: 1, latest: time })
    }
  }
  return [...groups.entries()]
    .toSorted(([, a], [, b]) => b.value - a.value || b.latest - a.latest)
    .slice(0, limit)
    .map(([key, group]) => ({ key, label: group.label, value: group.value }))
}

// ── base comum ──────────────────────────────────────────────────────────

/** Momentos dos registros do tipo — `symptom` e `no_symptoms` são a mesma tabela. */
export function stampsOf(sources: TimelineSources, kind: SummaryKind): string[] {
  switch (kind) {
    case 'exposure':
      return sources.exposures.map((item) => item.occurred_at)
    case 'symptom':
      return sources.symptomEvents
        .filter((event) => !event.no_symptoms)
        .map((item) => item.occurred_at)
    case 'no_symptoms':
      return sources.symptomEvents
        .filter((event) => event.no_symptoms)
        .map((item) => item.occurred_at)
    case 'diaper':
      return sources.diaperRecords.map((item) => item.occurred_at)
    case 'product':
      return sources.productRecords.map((item) => item.occurred_at)
    case 'environment':
      return sources.environmentRecords.map((item) => item.occurred_at)
    case 'note':
      return sources.notes.map((item) => item.occurred_at)
  }
}

/**
 * O último registro do tipo já acontecido, com o mesmo título e detalhe do
 * Diário. O vínculo de um sintoma com alimentação, visita ou produto não
 * entra: o resumo não aproxima um registro do outro.
 */
export function latestRecord(
  sources: TimelineSources,
  kind: SummaryKind,
  reference: Date,
): LatestRecord | null {
  const only: TimelineSources = {
    exposures: kind === 'exposure' ? sources.exposures : [],
    symptomEvents: kind === 'symptom' || kind === 'no_symptoms' ? sources.symptomEvents : [],
    diaperRecords: kind === 'diaper' ? sources.diaperRecords : [],
    notes: kind === 'note' ? sources.notes : [],
    productRecords: kind === 'product' ? sources.productRecords : [],
    environmentRecords: kind === 'environment' ? sources.environmentRecords : [],
    healthRecords: [],
    stageHistory: [],
  }
  const event = buildTimeline(only).find(
    (item) => item.kind === kind && !isAfter(item.occurredAt, reference),
  )
  if (!event) return null
  return {
    occurredAt: event.occurredAt,
    title: truncateText(event.title, 120),
    ...(event.detail ? { detail: truncateText(event.detail) } : {}),
  }
}

export function baseSummary(
  sources: TimelineSources,
  kind: SummaryKind,
  reference: Date = new Date(),
  days: number = WEEK,
): BaseSummary {
  const stamps = stampsOf(sources, kind)
  return {
    counts: countRecords(stamps, reference),
    days: countByDay(stamps, reference, days),
    latest: latestRecord(sources, kind, reference),
  }
}

// ── alimentação ─────────────────────────────────────────────────────────

const DAIRY_TONES: Record<string, ChartTone> = { sim: 'chart1', nao: 'chart2', nao_sei: 'neutral' }

export type ExposureSummary = BaseSummary & {
  /** Leite ou derivados nos últimos 7 dias: Sim, Não, Não sei e sem resposta. */
  dairy: StackPart[]
  /** Os alimentos mais registrados nos últimos 7 dias (até 3). */
  topFoods: RankItem[]
}

export function summarizeExposures(
  sources: TimelineSources,
  reference: Date = new Date(),
): ExposureSummary {
  const week = inLastWeek(sources.exposures, reference)
  const dairy: StackPart[] = [
    ...EXPOSURE_DAIRY_OPTIONS.map((option) => ({
      key: option.value,
      label: option.label,
      value: week.filter((item) => item.contains_dairy === option.value).length,
      tone: DAIRY_TONES[option.value] ?? 'neutral',
    })),
    {
      key: 'sem_resposta',
      label: 'Não informado',
      value: week.filter((item) => !item.contains_dairy).length,
      tone: 'neutralSoft',
    },
  ]
  return {
    ...baseSummary(sources, 'exposure', reference),
    dairy,
    // Mesmo alimento escrito com maiúscula ou espaço diferente é o mesmo item.
    topFoods: rank(
      week,
      (item) => item.food.trim().toLocaleLowerCase('pt-BR') || null,
      (item) => item.food.trim(),
      3,
    ),
  }
}

// ── sintomas ────────────────────────────────────────────────────────────

const SYMPTOM_LABELS = new Map(SYMPTOMS.map((symptom) => [symptom.code, symptom.label]))
const INTENSITY_LABELS = new Map<number, string>(
  INTENSITIES.map((item) => [item.value, item.label]),
)

/** Último status registrado de um episódio acompanhado. */
export type EpisodeEvolution = {
  id: string
  /** "Vômito (Intensa) · Choro intenso (Leve)" */
  title: string
  startedAt: string
  status: string
  statusAt: string
}

export type SymptomSummary = BaseSummary & {
  /** Sintomas mais marcados nos últimos 7 dias (até 5). */
  topSymptoms: RankItem[]
  /** Itens marcados nos últimos 7 dias por intensidade, Leve → Intensa. */
  intensity: RankItem[]
  /** Episódios com evolução registrada, pelo último status (até 3). */
  evolutions: EpisodeEvolution[]
}

function describeEpisode(event: SymptomEventWithItems): string {
  return event.items
    .map((item) => {
      const label = SYMPTOM_LABELS.get(item.code) ?? item.code
      const intensity = INTENSITY_LABELS.get(item.intensity)
      return intensity ? `${label} (${intensity})` : label
    })
    .join(' · ')
}

export function summarizeSymptoms(
  sources: TimelineSources,
  reference: Date = new Date(),
): SymptomSummary {
  const events = sources.symptomEvents.filter((event) => !event.no_symptoms)
  const week = inLastWeek(events, reference)
  const items = week.flatMap((event) =>
    event.items.map((item) => ({ ...item, occurred_at: event.occurred_at })),
  )

  const intensity = INTENSITIES.map<RankItem>((option) => ({
    key: String(option.value),
    label: option.label,
    emoji: option.emoji,
    value: items.filter((item) => item.intensity === option.value).length,
  }))

  const evolutions = events
    .flatMap<EpisodeEvolution>((event) => {
      const last = recentFirst(event.evolutions ?? [], reference)[0]
      if (!last) return []
      return [
        {
          id: event.id,
          title: truncateText(describeEpisode(event), 90),
          startedAt: event.occurred_at,
          status: SYMPTOM_EVOLUTION_LABELS.get(last.status) ?? last.status,
          statusAt: last.occurred_at,
        },
      ]
    })
    .toSorted((a, b) => new Date(b.statusAt).getTime() - new Date(a.statusAt).getTime())
    .slice(0, 3)

  return {
    ...baseSummary(sources, 'symptom', reference),
    topSymptoms: rank(
      items,
      (item) => item.code,
      (item) => SYMPTOM_LABELS.get(item.code) ?? item.code,
      5,
    ),
    intensity,
    evolutions,
  }
}

// ── tudo tranquilo ──────────────────────────────────────────────────────

export type CalmSummary = BaseSummary & {
  daysIn7: number
  daysIn14: number
}

export function summarizeCalm(sources: TimelineSources, reference: Date = new Date()): CalmSummary {
  const stamps = stampsOf(sources, 'no_symptoms')
  return {
    ...baseSummary(sources, 'no_symptoms', reference, FORTNIGHT),
    daysIn7: daysWithRecords(stamps, reference, WEEK),
    daysIn14: daysWithRecords(stamps, reference, FORTNIGHT),
  }
}

// ── fralda ──────────────────────────────────────────────────────────────

const CONSISTENCY_TONES: Record<string, ChartTone> = {
  habitual: 'chart1',
  liquida: 'chart2',
  pastosa: 'chart3',
  ressecada: 'chart4',
  nao_sei: 'neutral',
}

export type DiaperSummary = BaseSummary & {
  /** Consistência nos últimos 7 dias, incluindo as fraldas sem consistência marcada. */
  consistency: StackPart[]
  /** Fraldas com sangue registrado (Traços ou Visível) nos últimos 7 dias. */
  withBlood: number
  /** Fraldas com muco registrado (qualquer quantidade) nos últimos 7 dias. */
  withMucus: number
}

export function summarizeDiapers(
  sources: TimelineSources,
  reference: Date = new Date(),
): DiaperSummary {
  const week = inLastWeek(sources.diaperRecords, reference)
  return {
    ...baseSummary(sources, 'diaper', reference),
    consistency: [
      ...DIAPER_CONSISTENCY.map((option) => ({
        key: option.value,
        label: option.label,
        value: week.filter((item) => item.consistency === option.value).length,
        tone: CONSISTENCY_TONES[option.value] ?? 'neutral',
      })),
      {
        key: 'sem_resposta',
        label: 'Não informada',
        value: week.filter((item) => !item.consistency).length,
        tone: 'neutralSoft' as const,
      },
    ],
    withBlood: week.filter((item) => item.blood !== 'nao').length,
    withMucus: week.filter((item) => item.mucus !== 'nao').length,
  }
}

// ── produto e ambiente ──────────────────────────────────────────────────

export type RecentItem = {
  id: string
  occurredAt: string
  title: string
  detail?: string
}

export type ListSummary = BaseSummary & {
  /** Os 3 últimos registros. */
  recent: RecentItem[]
  /** Categorias (ou lugares) mais registrados no total (até 3). */
  top: RankItem[]
}

const productLabel = (category: string) => PRODUCT_CATEGORY_LABELS.get(category) ?? category
const placeLabel = (place: string) => ENVIRONMENT_PLACE_LABELS.get(place) ?? place

export function summarizeProducts(
  sources: TimelineSources,
  reference: Date = new Date(),
): ListSummary {
  return {
    ...baseSummary(sources, 'product', reference),
    recent: recentFirst(sources.productRecords, reference)
      .slice(0, 3)
      .map((item) => {
        const detail = [item.name, item.brand].filter(Boolean).join(' · ')
        return {
          id: item.id,
          occurredAt: item.occurred_at,
          title: productLabel(item.category),
          ...(detail ? { detail: truncateText(detail, 60) } : {}),
        }
      }),
    top: rank(
      sources.productRecords,
      (item) => item.category,
      (item) => productLabel(item.category),
      3,
    ),
  }
}

export function summarizeEnvironments(
  sources: TimelineSources,
  reference: Date = new Date(),
): ListSummary {
  return {
    ...baseSummary(sources, 'environment', reference),
    recent: recentFirst(sources.environmentRecords, reference)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        occurredAt: item.occurred_at,
        title: placeLabel(item.place),
        ...(item.different ? { detail: truncateText(item.different, 60) } : {}),
      })),
    top: rank(
      sources.environmentRecords,
      (item) => item.place,
      (item) => placeLabel(item.place),
      3,
    ),
  }
}

// ── observação ──────────────────────────────────────────────────────────

export type NoteSummary = BaseSummary & {
  /** As 3 últimas observações, com o texto cortado. */
  recent: RecentItem[]
}

export function summarizeNotes(
  sources: TimelineSources,
  reference: Date = new Date(),
): NoteSummary {
  return {
    ...baseSummary(sources, 'note', reference),
    recent: recentFirst(sources.notes, reference)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        occurredAt: item.occurred_at,
        title: truncateText(item.content, 90),
      })),
  }
}

// ── TPO ─────────────────────────────────────────────────────────────────

/**
 * Situação de uma etapa no TPO em andamento. Descreve só o caminho feito:
 * `visited` = percorrida (teve período neste TPO), `current` = etapa em
 * curso, `upcoming` = a seguir, `skipped` = anterior à etapa em curso e
 * não percorrida (o TPO pode começar numa etapa adiante).
 */
export type TpoStepStatus = 'visited' | 'current' | 'upcoming' | 'skipped'

export type TpoStep = {
  ordinal: number
  label: string
  status: TpoStepStatus
}

export type TpoJourney = {
  steps: TpoStep[]
  /** Dias de cada etapa percorrida (inclusive a em curso), na ordem da escada. */
  daysByStage: RankItem[]
  /** Dias de TPO: sem os dias de pausa e sem contar o mesmo dia duas vezes. */
  totalDays: number
}

/**
 * Percurso do TPO em andamento: a escada com a situação de cada etapa e os
 * dias vividos em cada uma. Os dias usam a mesma regra do "Resumo por
 * etapa" do Relatório (`daysOfPeriods`): a pausa fecha o período e não
 * conta, e um dia não conta duas vezes na mesma etapa. O dia em que a etapa
 * muda conta nas duas etapas, mas uma vez só no total.
 */
export function summarizeTpoJourney(
  history: readonly StageHistory[],
  protocolId: string,
  currentStage: number,
  stages: readonly { ordinal: number; label: string }[],
  reference: Date = new Date(),
): TpoJourney {
  const periods = history.filter((period) => period.protocol_id === protocolId)
  const visited = new Set(periods.map((period) => period.stage))

  const steps = stages.map<TpoStep>((stage) => ({
    ordinal: stage.ordinal,
    label: stage.label,
    status:
      stage.ordinal === currentStage
        ? 'current'
        : visited.has(stage.ordinal)
          ? 'visited'
          : stage.ordinal > currentStage
            ? 'upcoming'
            : 'skipped',
  }))

  const daysByStage = steps
    .filter((step) => step.status === 'visited' || step.status === 'current')
    .map<RankItem>((step) => ({
      key: String(step.ordinal),
      label: `Etapa ${step.ordinal} — ${step.label}${step.status === 'current' ? ' (em curso)' : ''}`,
      value: daysOfPeriods(
        periods.filter((period) => period.stage === step.ordinal),
        reference,
      ),
    }))

  return { steps, daysByStage, totalDays: daysOfPeriods(periods, reference) }
}
