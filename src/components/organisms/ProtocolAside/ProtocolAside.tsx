import { Link } from 'react-router-dom'
import { Loading } from '@/components/atoms/Loading'
import { Card } from '@/components/molecules/Card'
import { StageProgress } from '@/components/molecules/StageProgress'
import { TimelineItem } from '@/components/molecules/TimelineItem'
import { useChild } from '@/hooks/useChild'
import { useTimeline } from '@/hooks/useTimeline'
import { useTpoStages, stageLabelFrom } from '@/hooks/useTpoStages'
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
  const { activeTpo } = useChild()
  const { events, loading } = useTimeline()
  // A escada vem de `tpo_stages`, como no resto do módulo TPO: renomear ou
  // acrescentar uma etapa no banco tem de chegar aqui também (F4).
  const { stages } = useTpoStages()

  if (!activeTpo) return null

  const { protocol, currentStagePeriod } = activeTpo
  const recent = events.slice(0, RECENT)

  return (
    <aside className={styles.aside} aria-label="Resumo do acompanhamento">
      <Card as="section" aria-label="Etapa atual">
        <StageProgress
          current={protocol.current_stage}
          total={stages.length}
          label={stageLabelFrom(stages, protocol.current_stage)}
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
            <Link to="/app/diario" className={styles.all}>
              Ver o diário completo
            </Link>
          </>
        )}
      </section>
    </aside>
  )
}
