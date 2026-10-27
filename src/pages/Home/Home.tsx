import { Link } from 'react-router-dom'
import { User } from 'lucide-react'
import { AnimatedContent } from '@/components/animations/AnimatedContent'
import { FadeContent } from '@/components/animations/FadeContent'
import { ActionTile } from '@/components/molecules/ActionTile'
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
  const { sources } = useDiary()
  const { stages } = useTpoStages()

  // RequireChild garante que existe; a guarda é só para o tipo.
  if (!child) return null

  const summary = buildHomeSummary(sources)

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
        <CALM_ACTION.icon size={20} aria-hidden="true" />
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
