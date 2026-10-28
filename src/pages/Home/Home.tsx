import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User } from 'lucide-react'
import { BrandIllustration } from '@/components/atoms/BrandIllustration'
import { Button } from '@/components/atoms/Button'
import { Loading } from '@/components/atoms/Loading'
import { Alert } from '@/components/molecules/Alert'
import { AreaEmoji, KIND_AREA } from '@/components/molecules/AreaEmoji'
import type { Area } from '@/components/molecules/AreaEmoji'
import { DashboardCard } from '@/components/molecules/DashboardCard'
import { Sparkline } from '@/components/molecules/Sparkline'
import { StageStepper } from '@/components/molecules/StageStepper'
import { TIMELINE_KINDS } from '@/components/molecules/TimelineItem'
import { WeekStrip } from '@/components/molecules/charts/WeekStrip'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { CALM_ACTION, HOME_ACTIONS } from '@/constants/shortcuts'
import { APP_DISCLAIMER } from '@/constants/disclaimers'
import { formatKg } from '@/constants/health'
import { useDiary } from '@/hooks/useDiary'
import { useChild } from '@/hooks/useChild'
import { useTpoStages, stageLabelFrom } from '@/hooks/useTpoStages'
import { buildHealthOverview } from '@/utils/healthSummary'
import {
  buildHomeDashboard,
  childAgeLabel,
  formatSince,
  greetingFor,
  recentEvents,
} from '@/utils/dashboard'
import { dayOfStage, formatDate, formatDateTime, formatShortDate } from '@/utils/dates'
import { buildHomeSummary } from '@/utils/homeSummary'
import { buildTimeline } from '@/utils/timeline'
import { summarizeTpoJourney } from '@/utils/typeSummary'
import { HomeTile } from './HomeTile'
import styles from './Home.module.css'

/** A área (cor e emoji) de cada atalho da Home. */
const ACTION_AREA: Record<string, Area> = {
  '/app/alimentacao': 'food',
  '/app/sintomas': 'symptom',
  '/app/fralda': 'diaper',
  '/app/produto': 'product',
  '/app/ambiente': 'environment',
  '/app/saude': 'health',
  [CALM_ACTION.to]: 'calm',
}

function countText(count: number, one: string, many: string): string {
  return count === 1 ? `1 ${one}` : `${count} ${many}`
}

export default function Home() {
  const { child, activeTpo, pausedTpo } = useChild()
  const { sources, loading, errorMessage, refresh } = useDiary()
  const { stages } = useTpoStages()
  const [retrying, setRetrying] = useState(false)
  // Um "agora" por abertura da tela: as contas não mudam a cada renderização.
  const [now] = useState(() => new Date())

  // Sem o diário carregado, o painel diria "Nenhum registro hoje" a quem tem
  // registros — por isso só é montado depois de uma leitura bem-sucedida.
  const ready = !loading && !errorMessage

  const data = useMemo(() => {
    if (!ready) return null
    const events = buildTimeline(sources, (ordinal) => stageLabelFrom(stages, ordinal))
    return {
      summary: buildHomeSummary(sources, now),
      dashboard: buildHomeDashboard(sources, now),
      health: buildHealthOverview(sources.healthRecords, now),
      recent: recentEvents(events, now, 5),
    }
  }, [ready, sources, stages, now])

  const tpo = activeTpo ?? pausedTpo
  const journey = useMemo(
    () =>
      tpo && ready
        ? summarizeTpoJourney(
            sources.stageHistory,
            tpo.protocol.id,
            tpo.protocol.current_stage,
            stages,
            now,
          )
        : null,
    [tpo, ready, sources.stageHistory, stages, now],
  )

  // RequireChild garante que existe; a guarda é só para o tipo.
  if (!child) return null

  const age = childAgeLabel(child.birth_date, now)

  async function retry() {
    setRetrying(true)
    try {
      await refresh()
    } finally {
      setRetrying(false)
    }
  }

  const latestFor = (to: string) => (data ? (data.dashboard.latestByRoute[to] ?? null) : undefined)

  return (
    <AppTemplate
      title={child.name}
      bottomNav
      headerAside={
        <Link
          to="/app/perfil"
          className={styles.profileLink}
          aria-label="Perfil e dados da criança"
        >
          <User size={20} aria-hidden="true" />
          <span>Perfil</span>
        </Link>
      }
    >
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.greeting}>{greetingFor(now)}!</p>
          <p className={styles.heroLine}>
            {age ? `${child.name} está com ${age}.` : `O diário de ${child.name}.`}
          </p>
          <p className={styles.heroDate}>{format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <BrandIllustration className={styles.heroArt} />
      </div>

      <section className={styles.block} aria-labelledby="home-registrar">
        <h2 id="home-registrar" className={styles.blockTitle}>
          O que você quer registrar agora?
        </h2>
        <nav className={styles.tiles} aria-label="Registrar">
          {HOME_ACTIONS.map((action) => (
            <HomeTile
              key={action.to}
              to={action.to}
              label={action.label}
              hint={action.hint}
              area={ACTION_AREA[action.to] ?? 'note'}
              emphasis={action.emphasis}
              latest={latestFor(action.to)}
              reference={now}
            />
          ))}
        </nav>
        <HomeTile
          to={CALM_ACTION.to}
          label="Tudo tranquilo por aqui?"
          hint={CALM_ACTION.hint}
          area="calm"
          wide
          latest={latestFor(CALM_ACTION.to)}
          reference={now}
        />
      </section>

      <section className={styles.block} aria-labelledby="home-painel">
        <div className={styles.blockHeader}>
          <h2 id="home-painel" className={styles.blockTitle}>
            Acompanhamento
          </h2>
          <Link to="/app/diario" className={styles.textLink}>
            Ver o Diário completo
          </Link>
        </div>

        {loading && (
          <div className={styles.state}>
            <Loading label="Carregando o resumo..." />
          </div>
        )}

        {!loading && errorMessage && (
          <div className={[styles.state, styles.stateError].join(' ')}>
            {/* A barra de status já avisa quando falta conexão. */}
            <Alert variant="error">Não foi possível carregar o resumo agora.</Alert>
            <Button
              variant="secondary"
              busy={retrying}
              busyLabel="Carregando..."
              onClick={() => void retry()}
            >
              Tentar de novo
            </Button>
          </div>
        )}

        {data && (
          <div className={styles.dashboard}>
            <DashboardCard
              className={styles.today}
              headingLevel={3}
              title="Hoje"
              subtitle={
                data.dashboard.todayTotal === 0
                  ? 'Nenhum registro hoje ainda'
                  : countText(data.dashboard.todayTotal, 'registro hoje', 'registros hoje')
              }
            >
              {data.dashboard.today.length > 0 && (
                <ul className={styles.areaList}>
                  {data.dashboard.today.map((item) => (
                    <li key={item.area} className={styles.areaRow}>
                      <AreaEmoji area={item.area} size="sm" />
                      <span className={styles.areaLabel}>{item.label}</span>
                      <span className={styles.areaCount}>{item.count}</span>
                    </li>
                  ))}
                </ul>
              )}
              <dl className={styles.facts}>
                <div className={styles.fact}>
                  <dt>Últimos sintomas</dt>
                  <dd>{data.summary.latestSymptomsLabel}</dd>
                </div>
              </dl>
            </DashboardCard>

            <DashboardCard
              className={styles.week}
              headingLevel={3}
              title="Últimos 7 dias"
              subtitle={countText(
                data.dashboard.weekTotal,
                'registro na semana',
                'registros na semana',
              )}
            >
              <WeekStrip title="Registros por dia, todas as áreas" days={data.dashboard.week} />
              <dl className={styles.stats}>
                <div className={styles.stat}>
                  <dt>Média por dia</dt>
                  <dd>
                    {(data.dashboard.weekTotal / data.dashboard.week.length).toLocaleString(
                      'pt-BR',
                      {
                        maximumFractionDigits: 1,
                      },
                    )}
                  </dd>
                </div>
                <div className={styles.stat}>
                  <dt>Dias com registro</dt>
                  <dd>
                    {data.dashboard.week.filter((day) => day.count > 0).length} de{' '}
                    {data.dashboard.week.length}
                  </dd>
                </div>
              </dl>
            </DashboardCard>

            <DashboardCard
              className={styles.health}
              headingLevel={3}
              title="Saúde"
              area="health"
              footer={
                <Link to="/app/saude" state={{ from: '/app' }} className={styles.textLink}>
                  Abrir Saúde
                </Link>
              }
            >
              {data.health.weightSeries.length >= 2 && (
                <Sparkline title="Peso" points={data.health.weightSeries} formatValue={formatKg} />
              )}
              <dl className={styles.facts}>
                <div className={styles.fact}>
                  <dt>Últimas medidas</dt>
                  <dd>{data.summary.latestMeasuresLabel}</dd>
                </div>
                <div className={styles.fact}>
                  <dt>Tratamento ativo</dt>
                  {data.health.treatments.length === 0 ? (
                    <dd>{data.summary.activeTreatmentLabel}</dd>
                  ) : (
                    data.health.treatments.map(({ treatment, nextDoseLabel }) => (
                      <dd key={treatment.record.id}>
                        <span className={styles.factStrong}>{treatment.name}</span>
                        {` · ${treatment.scheduleLabel}`}
                        <span className={styles.factNote}>{nextDoseLabel}</span>
                      </dd>
                    ))
                  )}
                </div>
                <div className={styles.fact}>
                  <dt>Próxima consulta</dt>
                  <dd>
                    {data.health.nextAppointment
                      ? `${data.health.nextAppointment.specialty} · ${formatDateTime(
                          data.health.nextAppointment.occurredAt,
                        )}`
                      : 'Nenhuma registrada'}
                  </dd>
                </div>
                <div className={styles.fact}>
                  <dt>Última vacina</dt>
                  <dd>
                    {data.health.latestVaccine
                      ? `${data.health.latestVaccine.name} · ${formatDate(
                          data.health.latestVaccine.occurredAt,
                        )}`
                      : 'Nenhuma registrada'}
                  </dd>
                </div>
              </dl>
            </DashboardCard>

            <DashboardCard
              className={styles.tpo}
              headingLevel={3}
              title="TPO"
              area="tpo"
              subtitle={activeTpo ? 'Em andamento' : pausedTpo ? 'Pausado' : 'Opcional'}
              footer={
                <Link to="/app/tpo" className={styles.textLink}>
                  {tpo ? 'Abrir a aba TPO' : 'Conhecer a aba TPO'}
                </Link>
              }
            >
              {tpo ? (
                <>
                  <p className={styles.tpoStage}>
                    <span className={styles.tpoCounter}>
                      Etapa {tpo.protocol.current_stage} de {stages.length}
                    </span>
                    {stageLabelFrom(stages, tpo.protocol.current_stage)}
                  </p>
                  {activeTpo?.currentStagePeriod && (
                    <p className={styles.tpoDay}>
                      Dia {dayOfStage(activeTpo.currentStagePeriod.started_at, now)} desta etapa
                    </p>
                  )}
                  {!activeTpo && pausedTpo && (
                    <p className={styles.tpoDay}>Pausado em {formatDate(pausedTpo.pausedAt)}</p>
                  )}
                  {journey && (
                    <>
                      <StageStepper steps={journey.steps} variant="compact" />
                      <dl className={styles.stats}>
                        <div className={styles.stat}>
                          <dt>Dias de TPO</dt>
                          <dd>{journey.totalDays}</dd>
                        </div>
                        <div className={styles.stat}>
                          <dt>Início</dt>
                          <dd>{formatShortDate(tpo.protocol.started_at)}</dd>
                        </div>
                      </dl>
                    </>
                  )}
                </>
              ) : (
                <p className={styles.muted}>
                  Nenhum TPO em acompanhamento. Quando houver, a etapa e o dia aparecem aqui.
                </p>
              )}
            </DashboardCard>

            <DashboardCard
              className={styles.recent}
              headingLevel={3}
              title="Últimos registros"
              area="diary"
              footer={
                <Link to="/app/diario" className={styles.textLink}>
                  Ver todo o histórico no Diário
                </Link>
              }
            >
              {data.recent.length === 0 ? (
                <p className={styles.muted}>Nenhum registro ainda.</p>
              ) : (
                <ol className={styles.recentList}>
                  {data.recent.map((event) => (
                    <li key={`${event.kind}-${event.id}`} className={styles.recentRow}>
                      <AreaEmoji area={KIND_AREA[event.kind]} size="sm" />
                      <div className={styles.recentText}>
                        <p className={styles.recentTitle}>{event.title}</p>
                        <p className={styles.recentMeta}>
                          {TIMELINE_KINDS[event.kind].label} ·{' '}
                          <time dateTime={event.occurredAt}>
                            {formatSince(event.occurredAt, now) ??
                              formatShortDate(event.occurredAt)}
                          </time>
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </DashboardCard>
          </div>
        )}
      </section>

      <p className={styles.disclaimer}>{APP_DISCLAIMER}</p>
    </AppTemplate>
  )
}
