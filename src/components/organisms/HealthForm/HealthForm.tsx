import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import type { HealthData } from '@/services/health'
import { toDateTimeLocalValue } from '@/utils/dates'
import type { ActionState, HealthKind } from '@/types'
import styles from './HealthForm.module.css'

export type HealthFormValues = {
  occurredAt: string
  title: string | null
  data: HealthData
  note: string | null
}

type Props = {
  kind: HealthKind
  state: ActionState
  errorMessage?: string
  onSubmit: (values: HealthFormValues) => void
}

/**
 * Um formulário, quatro formas — README FINAL §13–16. O app só registra o
 * que foi informado: não sugere medicamento, dose nem conduta.
 */
export function HealthForm({ kind, state, errorMessage, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [dose, setDose] = useState('')
  const [reaction, setReaction] = useState('')
  const [guidance, setGuidance] = useState('')
  const [questions, setQuestions] = useState('')
  const [kg, setKg] = useState('')
  const [occurredAt, setOccurredAt] = useState(toDateTimeLocalValue())
  const [note, setNote] = useState('')
  const [localError, setLocalError] = useState<string>()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (kind === 'weight') {
      const value = Number(kg.replace(',', '.'))
      if (!kg.trim() || Number.isNaN(value) || value <= 0) {
        setLocalError('Informe o peso.')
        return
      }
    } else if (!title.trim()) {
      setLocalError(
        kind === 'appointment' ? 'Informe a especialidade.' : 'Informe o nome.',
      )
      return
    }
    setLocalError(undefined)

    const data: HealthData = {}
    if (kind === 'medication' && dose.trim()) data.dose = dose.trim()
    if (kind === 'vaccine' && reaction.trim()) data.reaction = reaction.trim()
    if (kind === 'appointment') {
      if (guidance.trim()) data.guidance = guidance.trim()
      if (questions.trim()) data.questions = questions.trim()
    }
    if (kind === 'weight') data.kg = Number(kg.replace(',', '.'))

    onSubmit({
      occurredAt,
      title: kind === 'weight' ? null : title.trim(),
      data,
      note: note.trim() || null,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {kind === 'medication' && (
        <>
          <Input
            label="Nome do medicamento"
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Data e hora"
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
          <details className={styles.details}>
            <summary className={styles.summary}>
              <Plus size={16} aria-hidden="true" />
              Adicionar detalhes
            </summary>
            <div className={styles.detailsBody}>
              <Input
                label="Dose (opcional)"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
              />
              <Textarea
                label="Observação (opcional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </details>
        </>
      )}

      {kind === 'vaccine' && (
        <>
          <Input
            label="Nome da vacina"
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Data e hora"
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
          <Textarea
            label="Reação percebida (opcional)"
            value={reaction}
            onChange={(e) => setReaction(e.target.value)}
          />
          <Textarea
            label="Observação (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </>
      )}

      {kind === 'appointment' && (
        <>
          <Input
            label="Especialidade"
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Data e hora"
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
          <Textarea
            label="Principais orientações (opcional)"
            rows={3}
            value={guidance}
            onChange={(e) => setGuidance(e.target.value)}
          />
          <Textarea
            label="Dúvidas (opcional)"
            rows={2}
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
          />
          <Textarea
            label="Observação (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </>
      )}

      {kind === 'weight' && (
        <>
          <Input
            label="Peso (kg)"
            inputMode="decimal"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
          />
          <Input
            label="Data e hora"
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
          <Textarea
            label="Observação (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </>
      )}

      <div aria-live="polite">
        {localError && <Alert variant="error">{localError}</Alert>}
        {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      </div>

      <Button type="submit" busy={state === 'saving'}>
        Salvar registro
      </Button>
    </form>
  )
}
