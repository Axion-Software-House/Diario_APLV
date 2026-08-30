import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatedContent } from '@/components/animations/AnimatedContent'
import { FadeContent } from '@/components/animations/FadeContent'
import { ActionTile } from '@/components/molecules/ActionTile'
import { Card } from '@/components/molecules/Card'
import { Toast } from '@/components/molecules/Toast'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Button } from '@/components/atoms/Button'
import { CALM_ACTION, HOME_ACTIONS } from '@/constants/shortcuts'
import { stageLabel } from '@/constants/stages'
import { APP_DISCLAIMER } from '@/constants/disclaimers'
import { useAuth } from '@/hooks/useAuth'
import { useAuthAction } from '@/hooks/useAuthAction'
import { useFlash } from '@/hooks/useFlash'
import { useChild } from '@/hooks/useChild'
import { dayOfStage } from '@/utils/dates'
import styles from './Home.module.css'

export default function Home() {
  const { signOut } = useAuth()
  const { child, activeTpo } = useChild()
  const flash = useFlash()
  const [confirmed, setConfirmed] = useState(true)
  const { state, run } = useAuthAction(signOut)

  // RequireChild garante que existe; a guarda é só para o tipo.
  if (!child) return null

  return (
    <AppTemplate
      title={child.name}
      bottomNav
      headerAside={
        <Button
          variant="ghost"
          busy={state === 'saving'}
          busyLabel="Saindo..."
          onClick={() => void run(undefined)}
        >
          Sair
        </Button>
      }
    >
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

      <Link to={CALM_ACTION.to} className={styles.calm}>
        <CALM_ACTION.icon size={20} aria-hidden="true" />
        <span>Tudo tranquilo por aqui?</span>
      </Link>

      {activeTpo && (
        <Card as="section" className={styles.tpo} aria-label="TPO em andamento">
          <p className={styles.tpoLabel}>TPO em andamento</p>
          <p className={styles.tpoStage}>
            Etapa atual: {stageLabel(activeTpo.protocol.current_stage)}
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

      {flash && confirmed && <Toast message={flash} onDismiss={() => setConfirmed(false)} />}
    </AppTemplate>
  )
}
