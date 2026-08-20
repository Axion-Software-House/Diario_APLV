import { useState } from 'react'
import { Button } from '@/components/atoms/Button'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { Modal } from '@/components/organisms/Modal'
import {
  FIRST_STAGE,
  LAST_STAGE,
  STAGE_ACTIONS,
  STAGE_CHANGE_CONFIRMATION,
  stageLabel,
} from '@/constants/stages'
import type { StageAction } from '@/constants/stages'
import type { ActionState, StageOutcome } from '@/types'
import styles from './StageActions.module.css'

type Props = {
  current: number
  state: ActionState
  errorMessage?: string
  onConfirm: (outcome: StageOutcome, note: string | null) => void
}

function targetStage(outcome: StageOutcome, current: number): number {
  if (outcome === 'advanced') return current + 1
  if (outcome === 'returned') return current - 1
  return current
}

function isAvailable(action: StageAction, current: number): boolean {
  if (action.outcome === 'advanced') return current < LAST_STAGE
  if (action.outcome === 'returned') return current > FIRST_STAGE
  return true
}

/**
 * As três ações têm o mesmo peso visual de propósito: destacar "Avançar"
 * seria o app sugerindo conduta. Quem decide é a equipe assistente.
 */
export function StageActions({ current, state, errorMessage, onConfirm }: Props) {
  const [pending, setPending] = useState<StageAction | null>(null)
  const [note, setNote] = useState('')

  function close() {
    setPending(null)
    setNote('')
  }

  const target = pending ? targetStage(pending.outcome, current) : current

  return (
    <div className={styles.actions}>
      <div className={styles.buttons}>
        {STAGE_ACTIONS.filter((action) => isAvailable(action, current)).map((action) => (
          <Button key={action.outcome} variant="secondary" onClick={() => setPending(action)}>
            {action.label}
          </Button>
        ))}
      </div>

      <div aria-live="polite">
        {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      </div>

      <Modal
        open={pending !== null}
        title={pending ? `${pending.label} para a etapa ${target}?` : ''}
        onClose={close}
      >
        {pending && (
          <div className={styles.confirmation}>
            <p className={styles.target}>
              Etapa {target} — {stageLabel(target)}
            </p>

            <Alert variant="info">{STAGE_CHANGE_CONFIRMATION}</Alert>

            <Textarea
              label="Anotação sobre a etapa que termina (opcional)"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />

            <div className={styles.confirmButtons}>
              <Button variant="ghost" onClick={close}>
                Cancelar
              </Button>
              <Button
                busy={state === 'saving'}
                onClick={() => onConfirm(pending.outcome, note.trim() || null)}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
