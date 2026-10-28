import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Chip } from '@/components/atoms/Chip'
import { Loading } from '@/components/atoms/Loading'
import { Alert } from '@/components/molecules/Alert'
import { Card } from '@/components/molecules/Card'
import { GrowthChart } from '@/components/molecules/GrowthChart'
import {
  formatMeasure,
  formatMeasureNumber,
  latestMeasuresFrom,
  MEASURE_KEYS,
} from '@/constants/health'
import type { LatestMeasures, MeasureKey } from '@/constants/health'
import { formatDate, formatDateTime } from '@/utils/dates'
import {
  buildHealthOverview,
  growthSeries,
  nextAppointment,
  recentAppointments,
  recentDoses,
  recentVaccines,
  summarizeTreatments,
} from '@/utils/healthSummary'
import type {
  AppointmentItem,
  GrowthPoint,
  TreatmentSummary,
  VaccineItem,
} from '@/utils/healthSummary'
import type { HealthKind, HealthRecord } from '@/types'
import styles from './HealthSummary.module.css'

/** O que os resumos precisam da leitura de `health_records`. */
export type HealthRecordsState = {
  records: readonly HealthRecord[]
  loading: boolean
  errorMessage?: string
  onRetry: () => Promise<void>
}

const MEASURE_NAMES: Record<MeasureKey, string> = {
  kg: 'Peso',
  lengthCm: 'Comprimento ou altura',
  headCm: 'Perímetro cefálico',
}

/**
 * Carregando, erro ou o conteúdo. Lista vazia por carregamento ou falha não
 * é "nenhum registro": o conteúdo só aparece depois da leitura.
 */
function ReadState({
  state,
  children,
}: {
  state: Omit<HealthRecordsState, 'records'>
  children: ReactNode
}) {
  const [retrying, setRetrying] = useState(false)

  if (state.loading) return <Loading label="Carregando o resumo..." />
  if (state.errorMessage) {
    return (
      <div className={styles.error}>
        <Alert variant="error">Não foi possível carregar o resumo. {state.errorMessage}</Alert>
        <Button
          variant="secondary"
          busy={retrying}
          busyLabel="Carregando..."
          onClick={() => {
            setRetrying(true)
            void state.onRetry().finally(() => setRetrying(false))
          }}
        >
          Tentar de novo
        </Button>
      </div>
    )
  }
  return <>{children}</>
}

/** Um bloco do resumo: `section` com título próprio. */
function Block({
  title,
  level = 3,
  children,
}: {
  title: string
  level?: 2 | 3
  children: ReactNode
}) {
  const id = useId()
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <section className={styles.block} aria-labelledby={id}>
      <Heading id={id} className={level === 2 ? styles.title : styles.blockTitle}>
        {title}
      </Heading>
      {children}
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className={styles.empty}>{children}</p>
}

// ── Medicamento ─────────────────────────────────────────────────────────

function TreatmentList({
  treatments,
  doseLinkFrom,
}: {
  treatments: readonly TreatmentSummary[]
  /** No hub, cada tratamento leva à tela de Medicamento para registrar a dose. */
  doseLinkFrom?: string
}) {
  if (treatments.length === 0) return <Empty>Nenhum tratamento ativo.</Empty>
  return (
    <ul className={styles.list}>
      {treatments.map(({ treatment, nextDoseLabel }) => (
        <li key={treatment.record.id} className={styles.item}>
          <div className={styles.itemTop}>
            <span className={styles.itemName}>{treatment.name}</span>
            <Badge tone="primary">{treatment.statusLabel}</Badge>
          </div>
          <span className={styles.itemMeta}>{treatment.scheduleLabel}</span>
          <span className={styles.itemText}>{nextDoseLabel}</span>
          {treatment.lastDoseAt && (
            <span className={styles.itemMeta}>
              Última dose registrada: {formatDateTime(treatment.lastDoseAt)}
            </span>
          )}
          {doseLinkFrom !== undefined && (
            <Link to="/app/saude/medication" state={{ from: doseLinkFrom }} className={styles.link}>
              Registrar dose dada
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}

function MedicationSummary({ records }: { records: readonly HealthRecord[] }) {
  const [reference] = useState(() => new Date())
  const treatments = summarizeTreatments(records, reference)
  const doses = recentDoses(records, reference)
  return (
    <>
      <Block title="Tratamentos ativos">
        <TreatmentList treatments={treatments} />
      </Block>
      <Block title="Últimas doses">
        {doses.length === 0 ? (
          <Empty>Nenhuma dose registrada.</Empty>
        ) : (
          <ul className={styles.list}>
            {doses.map((dose) => (
              <li key={dose.id} className={styles.item}>
                <span className={styles.itemName}>{dose.name}</span>
                <span className={styles.itemMeta}>
                  {[dose.dose, formatDateTime(dose.occurredAt)].filter(Boolean).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Block>
    </>
  )
}

// ── Vacina ──────────────────────────────────────────────────────────────

function VaccineList({ vaccines }: { vaccines: readonly VaccineItem[] }) {
  if (vaccines.length === 0) return <Empty>Nenhuma vacina registrada.</Empty>
  return (
    <ul className={styles.list}>
      {vaccines.map((vaccine) => (
        <li key={vaccine.id} className={styles.item}>
          <span className={styles.itemName}>{vaccine.name}</span>
          <span className={styles.itemMeta}>{formatDate(vaccine.occurredAt)}</span>
          {vaccine.reaction && <span className={styles.itemText}>Reação: {vaccine.reaction}</span>}
        </li>
      ))}
    </ul>
  )
}

function VaccineSummary({ records }: { records: readonly HealthRecord[] }) {
  const [reference] = useState(() => new Date())
  return (
    <Block title="Últimas vacinas">
      <VaccineList vaccines={recentVaccines(records, reference)} />
    </Block>
  )
}

// ── Consulta ────────────────────────────────────────────────────────────

function AppointmentDetails({ appointment }: { appointment: AppointmentItem }) {
  return (
    <>
      <span className={styles.itemName}>{appointment.specialty}</span>
      <span className={styles.itemMeta}>{formatDateTime(appointment.occurredAt)}</span>
      {appointment.guidance && (
        <span className={styles.itemText}>Orientações: {appointment.guidance}</span>
      )}
      {appointment.questions && (
        <span className={styles.itemText}>Dúvidas: {appointment.questions}</span>
      )}
    </>
  )
}

function AppointmentSummary({ records }: { records: readonly HealthRecord[] }) {
  const [reference] = useState(() => new Date())
  const next = nextAppointment(records, reference)
  const recent = recentAppointments(records, reference)
  return (
    <>
      <Block title="Próxima consulta">
        {next ? (
          <div className={styles.item}>
            <AppointmentDetails appointment={next} />
          </div>
        ) : (
          <Empty>Nenhuma consulta futura registrada.</Empty>
        )}
      </Block>
      <Block title="Últimas consultas">
        {recent.length === 0 ? (
          <Empty>Nenhuma consulta registrada.</Empty>
        ) : (
          <ul className={styles.list}>
            {recent.map((appointment) => (
              <li key={appointment.id} className={styles.item}>
                <AppointmentDetails appointment={appointment} />
              </li>
            ))}
          </ul>
        )}
      </Block>
    </>
  )
}

// ── Peso e medidas ──────────────────────────────────────────────────────

function LatestMeasuresList({ latest }: { latest: LatestMeasures | null }) {
  const present = MEASURE_KEYS.filter((key) => latest?.[key])
  if (!latest || present.length === 0) return <Empty>Nenhuma medida registrada.</Empty>
  return (
    <dl className={styles.measures}>
      {present.map((key) => {
        const measure = latest[key]
        if (!measure) return null
        return (
          <div key={key} className={styles.measure}>
            <dt className={styles.itemMeta}>{MEASURE_NAMES[key]}</dt>
            <dd className={styles.measureValue}>
              {formatMeasure(key, measure.value)}{' '}
              <span className={styles.itemMeta}>em {formatDate(measure.occurredAt)}</span>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

type Series = 'kg' | 'lengthCm'

const SERIES: Record<Series, { label: string; title: string; unit: string }> = {
  kg: { label: 'Peso', title: 'Peso (kg)', unit: 'kg' },
  lengthCm: { label: 'Comprimento', title: 'Comprimento ou altura (cm)', unit: 'cm' },
}

/**
 * Gráfico de crescimento: peso e comprimento alternados (um eixo por vez —
 * escalas diferentes nunca dividem o mesmo gráfico). Só os valores
 * registrados, sem curva de percentil ou referência.
 */
function GrowthPanel({
  weightSeries,
  lengthSeries,
}: {
  weightSeries: readonly GrowthPoint[]
  lengthSeries: readonly GrowthPoint[]
}) {
  const available = (['kg', 'lengthCm'] as const).filter((key) =>
    key === 'kg' ? weightSeries.length > 0 : lengthSeries.length > 0,
  )
  const [choice, setChoice] = useState<Series>('kg')
  const series = available.includes(choice) ? choice : available[0]

  if (!series) return <Empty>Nenhuma medida de peso ou comprimento registrada.</Empty>

  const points = series === 'kg' ? weightSeries : lengthSeries
  const meta = SERIES[series]

  return (
    <div className={styles.growth}>
      {available.length > 1 && (
        <div className={styles.toggle} role="group" aria-label="Medida exibida no gráfico">
          {available.map((key) => (
            <Chip key={key} selected={key === series} onClick={() => setChoice(key)}>
              {SERIES[key].label}
            </Chip>
          ))}
        </div>
      )}
      <GrowthChart
        key={series}
        title={meta.title}
        points={points}
        formatValue={(value) => `${formatMeasureNumber(value)} ${meta.unit}`}
        formatTick={formatMeasureNumber}
      />
    </div>
  )
}

function MeasuresSummary({ records }: { records: readonly HealthRecord[] }) {
  const [reference] = useState(() => new Date())
  return (
    <>
      <Block title="Últimas medidas">
        <LatestMeasuresList latest={latestMeasuresFrom(records)} />
      </Block>
      <Block title="Crescimento">
        <GrowthPanel
          weightSeries={growthSeries(records, 'kg', reference)}
          lengthSeries={growthSeries(records, 'lengthCm', reference)}
        />
      </Block>
    </>
  )
}

// ── Exportados ──────────────────────────────────────────────────────────

const KIND_SUMMARIES: Record<
  HealthKind,
  (props: { records: readonly HealthRecord[] }) => ReactNode
> = {
  medication: MedicationSummary,
  vaccine: VaccineSummary,
  appointment: AppointmentSummary,
  weight: MeasuresSummary,
}

/** Resumo de um tipo de registro de Saúde, ao lado do formulário. */
export function HealthKindSummary({
  kind,
  state,
}: {
  kind: HealthKind
  state: HealthRecordsState
}) {
  const Summary = KIND_SUMMARIES[kind]
  const id = useId()
  return (
    <Card as="section" className={styles.card} aria-labelledby={id}>
      <h2 id={id} className={styles.title}>
        Resumo
      </h2>
      <ReadState state={state}>
        <Summary records={state.records} />
      </ReadState>
    </Card>
  )
}

/** "Resumo da saúde" do hub `/app/saude`. */
export function HealthOverviewPanel({
  state,
  origin,
}: {
  state: HealthRecordsState
  /** Origem repassada ao "Registrar dose dada" para o Voltar continuar certo. */
  origin: string
}) {
  const id = useId()
  const [reference] = useState(() => new Date())
  const overview = buildHealthOverview(state.records, reference)

  return (
    <Card as="section" className={styles.card} aria-labelledby={id}>
      <h2 id={id} className={styles.title}>
        Resumo da saúde
      </h2>
      <ReadState state={state}>
        <div className={styles.overviewGrid}>
          <Block title="Tratamentos ativos">
            <TreatmentList treatments={overview.treatments} doseLinkFrom={origin} />
          </Block>
          <Block title="Próxima consulta">
            {overview.nextAppointment ? (
              <div className={styles.item}>
                <span className={styles.itemName}>{overview.nextAppointment.specialty}</span>
                <span className={styles.itemMeta}>
                  {formatDateTime(overview.nextAppointment.occurredAt)}
                </span>
              </div>
            ) : (
              <Empty>Nenhuma consulta futura registrada.</Empty>
            )}
          </Block>
          <Block title="Última vacina">
            <VaccineList vaccines={overview.latestVaccine ? [overview.latestVaccine] : []} />
          </Block>
          <Block title="Últimas medidas">
            <LatestMeasuresList latest={overview.latestMeasures} />
          </Block>
        </div>
        <Block title="Crescimento">
          <GrowthPanel weightSeries={overview.weightSeries} lengthSeries={overview.lengthSeries} />
        </Block>
      </ReadState>
    </Card>
  )
}
