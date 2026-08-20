import { Link } from 'react-router-dom'
import { Loading } from '@/components/atoms/Loading'
import { Card } from '@/components/molecules/Card'
import { StageProgress } from '@/components/molecules/StageProgress'
import { TimelineItem } from '@/components/molecules/TimelineItem'
import { STAGES, stageLabel } from '@/constants/stages'
import { useProtocol } from '@/hooks/useProtocol'
import { useTimeline } from '@/hooks/useTimeline'
import { dayOfStage } from '@/utils/dates'
import styles from './ProtocolAside.module.css'

const RECENT = 5

/**
 * Resumo da etapa + timeline recente ao lado do formulário (≥1024px).
 *
 * É contexto, não parte do registro: carrega depois e nunca bloqueia o
 * formulário. Quem está registrando um sintoma às 3h não espera por isto.
 */
export function ProtocolAside() {
  const { active } = useProtocol()
  const { events, loading } = useTimeline()

  if (!active) return null

  const { protocol, currentStagePeriod } = active
  const recent = events.slice(0, RECENT)

  return (
    <aside className={styles.aside} aria-label="Resumo do acompanhamento">
      <Card as="section" aria-label="Etapa atual">
        <StageProgress
          current={protocol.current_stage}
          total={STAGES.length}
          label={stageLabel(protocol.current_stage)}
          dayOfStage={currentStagePeriod ? dayOfStage(currentStagePeriod.started_at) : undefined}
        />
      </Card>

      <section aria-label="Registros recentes">
        <h2 className={styles.heading}>Registros recentes</h2>

        {loading && <Loading label="Carregando..." />}

        {!loading && recent.length === 0 && <p className={styles.empty}>Nada registrado ainda.</p>}

        {!loading && recent.length > 0 && (
          <>
            <ul className={styles.list}>
              {recent.map((event) => (
                <TimelineItem key={`${event.kind}-${event.id}`} event={event} />
              ))}
            </ul>
            <Link to="/app/timeline" className={styles.all}>
              Ver a timeline completa
            </Link>
          </>
        )}
      </section>
    </aside>
  )
}
