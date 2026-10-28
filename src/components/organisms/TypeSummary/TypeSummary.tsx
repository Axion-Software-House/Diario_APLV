import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/atoms/Button'
import { Loading } from '@/components/atoms/Loading'
import { Alert } from '@/components/molecules/Alert'
import { Card } from '@/components/molecules/Card'
import { WeekStrip } from '@/components/molecules/charts/WeekStrip'
import type { CountUnit } from '@/components/molecules/charts/format'
import { formatDateTime } from '@/utils/dates'
import type { BaseSummary } from '@/utils/typeSummary'
import styles from './TypeSummary.module.css'

type Props = {
  /** Ex.: "Resumo de fraldas". */
  title: string
  /** Emoji da área, de `constants/emojis.ts`. */
  emoji: string
  /** Filtro do Diário aberto por "Ver todas no Diário" (`DIARY_FILTERS[].id`). */
  diaryFilter: string
  /** Unidade contada, ex.: fralda / fraldas. */
  unit: CountUnit
  /** Título da faixa de dias, ex.: "Fraldas por dia, últimos 7 dias". */
  stripTitle: string
  /** Texto quando o diário carregou e não há nenhum registro do tipo. */
  emptyText: string
  loading: boolean
  errorMessage?: string
  onRetry: () => Promise<void>
  /** `null` enquanto carrega ou se a leitura falhou. */
  summary: BaseSummary | null
  /** `false` quando a tela mostra a lista dos últimos no lugar do "Último registro". */
  showLatest?: boolean
  /** Blocos específicos do tipo, abaixo dos números e da faixa. */
  children?: ReactNode
}

/**
 * Casca dos resumos das telas de registro: título, números (hoje, últimos 7
 * dias, total), a faixa dos dias, o último registro e o link para o Diário
 * filtrado no tipo. Carregamento e erro tratados aqui, uma vez: o resumo
 * nunca diz "nenhum registro" antes de o diário carregar.
 */
export function TypeSummary({
  title,
  emoji,
  diaryFilter,
  unit,
  stripTitle,
  emptyText,
  loading,
  errorMessage,
  onRetry,
  summary,
  showLatest = true,
  children,
}: Props) {
  const [retrying, setRetrying] = useState(false)

  async function retry() {
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  const ready = !loading && !errorMessage && summary
  const empty = ready && summary.counts.total === 0

  return (
    <Card as="section" className={styles.summary} aria-label={title}>
      <h2 className={styles.title}>
        <span aria-hidden="true" data-emoji>
          {emoji}
        </span>
        <span>{title}</span>
      </h2>

      {loading && <Loading label="Carregando o resumo..." />}

      {!loading && errorMessage && (
        <div className={styles.error}>
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

      {empty && <p className={styles.empty}>{emptyText}</p>}

      {ready && !empty && (
        <>
          <TypeSummaryCounts
            items={[
              { label: 'Hoje', value: summary.counts.today },
              { label: 'Últimos 7 dias', value: summary.counts.last7 },
              { label: 'Total', value: summary.counts.total },
            ]}
          />

          <WeekStrip title={stripTitle} days={summary.days} unit={unit} />

          {showLatest && summary.latest && (
            <TypeSummaryBlock title="Último registro">
              <p className={styles.latestTitle}>{summary.latest.title}</p>
              {summary.latest.detail && (
                <p className={styles.latestDetail}>{summary.latest.detail}</p>
              )}
              <time className={styles.latestTime} dateTime={summary.latest.occurredAt}>
                {formatDateTime(summary.latest.occurredAt)}
              </time>
            </TypeSummaryBlock>
          )}

          {children}
        </>
      )}

      {/* Mesmo enquanto carrega, o Diário continua a um toque. */}
      <Link to="/app/diario" state={{ filter: diaryFilter }} className={styles.diaryLink}>
        Ver todas no Diário →
      </Link>
    </Card>
  )
}

/** Um bloco do resumo, com título próprio (h3). */
export function TypeSummaryBlock({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId()
  return (
    <section className={styles.block} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.blockTitle}>
        {title}
      </h3>
      {children}
    </section>
  )
}

/** Números em destaque, lado a lado (2 ou 3). */
export function TypeSummaryCounts({
  items,
}: {
  items: readonly { label: string; value: number | string }[]
}) {
  return (
    <dl className={styles.stats}>
      {items.map((item) => (
        <div key={item.label} className={styles.stat}>
          <dt className={styles.statLabel}>{item.label}</dt>
          <dd className={styles.statValue}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Lista curta de registros (produto, ambiente, observação), com data e hora. */
export function TypeSummaryList({
  items,
  timePrefix,
}: {
  items: readonly { id: string; occurredAt: string; title: string; detail?: string }[]
  /** Texto antes da data, ex.: "Início do episódio:". */
  timePrefix?: string
}) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.listItem}>
          <span className={styles.latestTitle}>{item.title}</span>
          {item.detail && <span className={styles.latestDetail}>{item.detail}</span>}
          <span className={styles.latestTime}>
            {timePrefix ? `${timePrefix} ` : ''}
            <time dateTime={item.occurredAt}>{formatDateTime(item.occurredAt)}</time>
          </span>
        </li>
      ))}
    </ul>
  )
}
