import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User } from 'lucide-react'
import { AnimatedContent } from '@/components/animations/AnimatedContent'
import { FadeContent } from '@/components/animations/FadeContent'
import { Button } from '@/components/atoms/Button'
import { Loading } from '@/components/atoms/Loading'
import { ActionTile } from '@/components/molecules/ActionTile'
import { Alert } from '@/components/molecules/Alert'
import { Card } from '@/components/molecules/Card'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { CALM_ACTION, HOME_ACTIONS } from '@/constants/shortcuts'
import { APP_DISCLAIMER } from '@/constants/disclaimers'
import { useDiary } from '@/hooks/useDiary'
import { useChild } from '@/hooks/useChild'
import { useTpoStages, stageLabelFrom } from '@/hooks/useTpoStages'
import { dayOfStage } from '@/utils/dates'
import { buildHomeSummary } from '@/utils/homeSummary'
import styles from './Home.module.css'

export default function Home() {
  const { child, activeTpo } = useChild()
  const { sources, loading, errorMessage, refresh } = useDiary()
  const { stages } = useTpoStages()
  const [retrying, setRetrying] = useState(false)

  // RequireChild garante que existe; a guarda é só para o tipo.
  if (!child) return null

  // Sem o diário carregado, o resumo diria "Nenhum sintoma registrado" a
  // quem tem sintomas registrados — por isso só é montado depois da leitura.
  const summary = loading || errorMessage ? null : buildHomeSummary(sources)

  async function retry() {
    setRetrying(true)
    try {
      await refresh()
    } finally {
      setRetrying(false)
    }
  }

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
      <Card as="section" className={styles.summary} aria-label="Resumo do acompanhamento">
        <div className={styles.summaryHeader}>
          <h2 className={styles.summaryTitle}>Resumo</h2>
          <Link to="/app/diario" className={styles.historyLink}>
            Ver histórico no Diário
          </Link>
        </div>

        {loading && <Loading label="Carregando o resumo..." />}

        {!loading && errorMessage && (
          <div className={styles.summaryError}>
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

        {summary && (
          <dl className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <dt className={styles.summaryTerm}>Registros de hoje</dt>
              <dd className={styles.summaryValue}>{summary.todayLabel}</dd>
            </div>
            <div className={styles.summaryItem}>
              <dt className={styles.summaryTerm}>Último peso</dt>
              <dd className={styles.summaryValue}>{summary.latestWeightLabel}</dd>
            </div>
            <div className={styles.summaryItemWide}>
              <dt className={styles.summaryTerm}>Tratamento ativo</dt>
              <dd className={styles.summaryValue}>{summary.activeTreatmentLabel}</dd>
            </div>
            <div className={styles.summaryItemWide}>
              <dt className={styles.summaryTerm}>Últimos sintomas</dt>
              <dd className={styles.summaryValue}>{summary.latestSymptomsLabel}</dd>
            </div>
          </dl>
        )}
      </Card>

      <FadeContent>
        <h2 className={styles.question}>O que você quer registrar agora?</h2>
      </FadeContent>

      <nav className={styles.grid} aria-label="Registrar">
        {HOME_ACTIONS.map((action, index) => (
          <AnimatedContent key={action.to} index={index}>
            <ActionTile {...action} />
          </AnimatedContent>
        ))}
      </nav>

      <Link to={CALM_ACTION.to} state={{ from: '/app' }} className={styles.calm}>
        <span className={styles.calmEmoji} aria-hidden="true" data-emoji>
          {CALM_ACTION.emoji}
        </span>
        <span>Tudo tranquilo por aqui?</span>
      </Link>

      {activeTpo && (
        <Card as="section" className={styles.tpo} aria-label="TPO em andamento">
          <p className={styles.tpoLabel}>TPO em andamento</p>
          <p className={styles.tpoStage}>
            Etapa atual: {stageLabelFrom(stages, activeTpo.protocol.current_stage)}
          </p>
          {activeTpo.currentStagePeriod && (
            <p className={styles.tpoDay}>
              Dia {dayOfStage(activeTpo.currentStagePeriod.started_at)}
            </p>
          )}
          <Link to="/app/tpo" className={styles.tpoLink}>
            Continuar
          </Link>
        </Card>
      )}

      <p className={styles.disclaimer}>{APP_DISCLAIMER}</p>
    </AppTemplate>
  )
}
