import { AnimatedContent } from '@/components/animations/AnimatedContent'
import { FadeContent } from '@/components/animations/FadeContent'
import { ActionTile } from '@/components/molecules/ActionTile'
import { Card } from '@/components/molecules/Card'
import { Toast } from '@/components/molecules/Toast'
import { StageProgress } from '@/components/molecules/StageProgress'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Button } from '@/components/atoms/Button'
import { SHORTCUTS } from '@/constants/shortcuts'
import { STAGES } from '@/constants/stages'
import { APP_DISCLAIMER } from '@/constants/disclaimers'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthAction } from '@/hooks/useAuthAction'
import { useFlash } from '@/hooks/useFlash'
import { useProtocol } from '@/hooks/useProtocol'
import { dayOfStage } from '@/utils/dates'
import styles from './Home.module.css'

export default function Home() {
  const { signOut } = useAuth()
  const { active } = useProtocol()
  const flash = useFlash()
  const [confirmed, setConfirmed] = useState(true)
  const { state, run } = useAuthAction(signOut)

  // RequireProtocol garante que existe; a guarda é só para o tipo.
  if (!active) return null

  const { child, protocol, currentStagePeriod } = active
  const stage = STAGES.find((item) => item.id === protocol.current_stage)

  return (
    <AppTemplate
      title={child.name}
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
        <Card as="section" className={styles.stage} aria-label="Etapa atual">
          <StageProgress
            current={protocol.current_stage}
            total={STAGES.length}
            label={stage?.label ?? ''}
            dayOfStage={currentStagePeriod ? dayOfStage(currentStagePeriod.started_at) : undefined}
          />
        </Card>
      </FadeContent>

      <nav className={styles.grid} aria-label="Ações do diário">
        {SHORTCUTS.map((shortcut, index) => (
          <AnimatedContent key={shortcut.to} index={index}>
            <ActionTile {...shortcut} />
          </AnimatedContent>
        ))}
      </nav>

      <p className={styles.disclaimer}>{APP_DISCLAIMER}</p>

      {flash && confirmed && <Toast message={flash} onDismiss={() => setConfirmed(false)} />}
    </AppTemplate>
  )
}
