import { differenceInCalendarDays, differenceInDays, differenceInMonths, parseISO } from 'date-fns'
import type { Area } from '@/components/molecules/AreaEmoji'
import { toDateValue } from '@/utils/dates'
import { countByDay, WEEK } from '@/utils/typeSummary'
import type { DayCount } from '@/utils/typeSummary'
import type { TimelineSources } from '@/utils/timeline'
import type { TimelineEvent } from '@/types'

/**
 * Painéis da Home e do Diário — funções puras sobre o diário já carregado.
 *
 * Tudo aqui é descritivo: quantos registros, quando foi o último. Nada cruza
 * um tipo de registro com outro (a "semana" é o total do dia, sem separar
 * alimentação de sintoma) e nada sugere conduta.
 *
 * Só fazem sentido com o diário lido: com `sources` vazio por carregamento
 * ou erro, "Nenhum registro hoje" seria afirmação falsa. Quem chama confere
 * `loading` e `errorMessage` antes.
 */

// ── cabeçalho ───────────────────────────────────────────────────────────

/** "Bom dia" (5h–11h), "Boa tarde" (12h–17h) ou "Boa noite". */
export function greetingFor(reference: Date = new Date()): string {
  const hour = reference.getHours()
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

/**
 * Idade pela data de nascimento: "12 dias", "7 meses", "1 ano e 3 meses".
 * `null` sem data, com data inválida ou no futuro.
 */
export function childAgeLabel(
  birthDate: string | null,
  reference: Date = new Date(),
): string | null {
  if (!birthDate) return null
  const birth = parseISO(birthDate)
  if (Number.isNaN(birth.getTime()) || birth.getTime() > reference.getTime()) return null

  const months = differenceInMonths(reference, birth)
  if (months < 1) {
    const days = differenceInDays(reference, birth)
    return days === 1 ? '1 dia' : `${days} dias`
  }
  if (months < 24) return months === 1 ? '1 mês' : `${months} meses`

  const years = Math.floor(months / 12)
  const rest = months % 12
  const yearsLabel = `${years} anos`
  if (rest === 0) return yearsLabel
  return `${yearsLabel} e ${rest === 1 ? '1 mês' : `${rest} meses`}`
}

/**
 * Há quanto tempo, em palavras curtas: "agora há pouco", "há 25 min",
 * "há 2 h", "ontem", "há 4 dias". `null` para um momento no futuro.
 */
export function formatSince(iso: string, reference: Date = new Date()): string | null {
  const date = new Date(iso)
  const diff = reference.getTime() - date.getTime()
  if (Number.isNaN(diff) || diff < 0) return null
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'agora há pouco'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24 && differenceInCalendarDays(reference, date) === 0) return `há ${hours} h`
  const days = differenceInCalendarDays(reference, date)
  if (days <= 1) return 'ontem'
  return `há ${days} dias`
}

// ── registros por área ──────────────────────────────────────────────────

/** As áreas do painel "Hoje", na ordem dos atalhos da Home. */
type AreaSource = {
  area: Area
  label: string
  /** Rota do atalho da Home que registra esta área (para "Último: há 2 h"). */
  to: string
  stamps: (sources: TimelineSources) => string[]
}

const AREA_SOURCES: readonly AreaSource[] = [
  {
    area: 'food',
    label: 'Alimentação',
    to: '/app/alimentacao',
    stamps: (s) => s.exposures.map((item) => item.occurred_at),
  },
  {
    area: 'symptom',
    label: 'Sintomas',
    to: '/app/sintomas',
    stamps: (s) => s.symptomEvents.filter((e) => !e.no_symptoms).map((e) => e.occurred_at),
  },
  {
    area: 'calm',
    label: 'Tudo tranquilo',
    to: '/app/tudo-tranquilo',
    stamps: (s) => s.symptomEvents.filter((e) => e.no_symptoms).map((e) => e.occurred_at),
  },
  {
    area: 'diaper',
    label: 'Fraldas',
    to: '/app/fralda',
    stamps: (s) => s.diaperRecords.map((item) => item.occurred_at),
  },
  {
    area: 'product',
    label: 'Produto / Higiene',
    to: '/app/produto',
    stamps: (s) => s.productRecords.map((item) => item.occurred_at),
  },
  {
    area: 'environment',
    label: 'Ambiente / Visita',
    to: '/app/ambiente',
    stamps: (s) => s.environmentRecords.map((item) => item.occurred_at),
  },
  {
    area: 'health',
    label: 'Saúde',
    to: '/app/saude',
    stamps: (s) => s.healthRecords.map((item) => item.occurred_at),
  },
  {
    area: 'note',
    label: 'Observações',
    to: '/app/observacao',
    stamps: (s) => s.notes.map((item) => item.occurred_at),
  },
]

export type AreaCount = {
  area: Area
  label: string
  count: number
}

/** Momentos de todos os registros da família (sem as viradas de etapa do TPO). */
export function allRecordStamps(sources: TimelineSources): string[] {
  return AREA_SOURCES.flatMap((source) => source.stamps(sources))
}

export type HomeDashboard = {
  /** Registros de hoje por área, só as áreas com registro. */
  today: AreaCount[]
  todayTotal: number
  /** Total de registros por dia nos últimos 7 dias (todas as áreas somadas). */
  week: DayCount[]
  weekTotal: number
  /**
   * Último registro já acontecido de cada atalho da Home, por rota
   * (`/app/alimentacao` → ISO). `null` = nenhum ainda.
   */
  latestByRoute: Record<string, string | null>
}

export function buildHomeDashboard(
  sources: TimelineSources,
  reference: Date = new Date(),
): HomeDashboard {
  const todayKey = toDateValue(reference)
  const now = reference.getTime()

  const today = AREA_SOURCES.map((source) => ({
    area: source.area,
    label: source.label,
    count: source.stamps(sources).filter((stamp) => toDateValue(stamp) === todayKey).length,
  })).filter((item) => item.count > 0)

  const week = countByDay(allRecordStamps(sources), reference, WEEK)

  const latestByRoute: Record<string, string | null> = {}
  for (const source of AREA_SOURCES) {
    const past = source
      .stamps(sources)
      .map((stamp) => new Date(stamp).getTime())
      .filter((time) => time <= now)
    latestByRoute[source.to] = past.length > 0 ? new Date(Math.max(...past)).toISOString() : null
  }

  return {
    today,
    todayTotal: today.reduce((sum, item) => sum + item.count, 0),
    week,
    weekTotal: week.reduce((sum, day) => sum + day.count, 0),
    latestByRoute,
  }
}

// ── Diário ──────────────────────────────────────────────────────────────

/** Os `limit` registros mais recentes já acontecidos (a timeline vem do mais novo). */
export function recentEvents(
  events: readonly TimelineEvent[],
  reference: Date = new Date(),
  limit = 5,
): TimelineEvent[] {
  const now = reference.getTime()
  return events.filter((event) => new Date(event.occurredAt).getTime() <= now).slice(0, limit)
}

/** Quantos registros por dia (chave local yyyy-MM-dd) — os pontos do calendário. */
export function countEventsByDay(events: readonly TimelineEvent[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const event of events) {
    const key = toDateValue(event.occurredAt)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}
