import { useState } from 'react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { Modal } from '@/components/organisms/Modal'
import { DIAPER_BLOOD, DIAPER_CONSISTENCY, DIAPER_MUCUS } from '@/constants/diaper'
import { EXPOSURE_AMOUNTS, FOOD_CONSUMERS } from '@/constants/exposure'
import { INTENSITIES, SYMPTOMS } from '@/constants/symptoms'
import { useEntryMutation } from '@/hooks/useEntryMutation'
import { deleteExposure, updateExposure } from '@/services/exposures'
import { deleteDiaperRecord, updateDiaperRecord } from '@/services/diapers'
import { deleteNote, updateNote } from '@/services/notes'
import { deleteSymptomEvent, updateSymptomEvent } from '@/services/symptoms'
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '@/utils/dates'
import type { TimelineSources } from '@/utils/timeline'
import type {
  DiaperBlood,
  DiaperConsistency,
  DiaperMucus,
  Exposure,
  FoodConsumer,
  TimelineEvent,
} from '@/types'
import styles from './DiaryEntryModal.module.css'

const SYMPTOM_LABELS = new Map(SYMPTOMS.map((symptom) => [symptom.code, symptom.label]))
const INTENSITY_LABELS = new Map(INTENSITIES.map((item) => [item.value, item.label]))

type Props = {
  entry: TimelineEvent | null
  sources: TimelineSources
  exposures: readonly Exposure[]
  onClose: () => void
  onSaved: () => void
}

/** Editar / excluir um registro do Diário. O histórico do TPO não chega aqui. */
export function DiaryEntryModal({ entry, sources, exposures, onClose, onSaved }: Props) {
  return (
    <Modal open={entry !== null} title="Editar registro" onClose={onClose}>
      {entry && (
        <Editor
          key={`${entry.kind}-${entry.id}`}
          entry={entry}
          sources={sources}
          exposures={exposures}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  )
}

function Editor({
  entry,
  sources,
  exposures,
  onClose,
  onSaved,
}: Props & { entry: TimelineEvent }) {
  const { state, errorMessage, run } = useEntryMutation()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const exposure = sources.exposures.find((item) => item.id === entry.id)
  const diaper = sources.diaperRecords.find((item) => item.id === entry.id)
  const note = sources.notes.find((item) => item.id === entry.id)
  const symptom = sources.symptomEvents.find((item) => item.id === entry.id)
  const record = exposure ?? diaper ?? note ?? symptom

  const [occurredAt, setOccurredAt] = useState(
    toDateTimeLocalValue(record?.occurred_at ?? new Date()),
  )
  const [text, setText] = useState(
    exposure?.note ?? diaper?.note ?? note?.content ?? symptom?.note ?? '',
  )
  const [consumer, setConsumer] = useState<FoodConsumer>(exposure?.consumer ?? 'child')
  const [food, setFood] = useState(exposure?.food ?? '')
  const [amount, setAmount] = useState<string>(exposure?.amount ?? '')
  const [brand, setBrand] = useState(exposure?.brand ?? '')
  const [blood, setBlood] = useState<DiaperBlood>(diaper?.blood ?? 'nao')
  const [mucus, setMucus] = useState<DiaperMucus>(diaper?.mucus ?? 'nao')
  const [consistency, setConsistency] = useState<string>(diaper?.consistency ?? '')
  const [exposureId, setExposureId] = useState<string>(symptom?.exposure_id ?? '')

  if (!record) {
    return <p className={styles.gone}>Este registro não está mais disponível.</p>
  }

  const at = fromDateTimeLocalValue(occurredAt)
  const trimmed = text.trim()

  async function save() {
    let ok = false
    if (exposure) {
      ok = await run(() =>
        updateExposure(exposure.id, {
          consumer,
          food: food.trim(),
          amount: (amount || null) as Exposure['amount'],
          brand: brand.trim() || null,
          details: exposure.details,
          occurredAt: at,
          note: trimmed || null,
        }),
      )
    } else if (diaper) {
      ok = await run(() =>
        updateDiaperRecord(diaper.id, {
          blood,
          mucus,
          consistency: (consistency || null) as DiaperConsistency | null,
          occurredAt: at,
          note: trimmed || null,
        }),
      )
    } else if (note) {
      ok = await run(() => updateNote(note.id, { content: trimmed, occurredAt: at }))
    } else if (symptom) {
      ok = await run(() =>
        updateSymptomEvent(symptom.id, {
          occurredAt: at,
          exposureId: exposureId || null,
          note: trimmed || null,
        }),
      )
    }
    if (ok) {
      onSaved()
      onClose()
    }
  }

  async function remove() {
    let ok = false
    if (exposure) ok = await run(() => deleteExposure(exposure.id))
    else if (diaper) ok = await run(() => deleteDiaperRecord(diaper.id))
    else if (note) ok = await run(() => deleteNote(note.id))
    else if (symptom) ok = await run(() => deleteSymptomEvent(symptom.id))
    if (ok) {
      onSaved()
      onClose()
    }
  }

  if (confirmDelete) {
    return (
      <div className={styles.body}>
        <p>Excluir este registro? Esta ação não pode ser desfeita.</p>
        {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
        <div className={styles.row}>
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            busy={state === 'saving'}
            busyLabel="Excluindo..."
            onClick={() => void remove()}
          >
            Excluir
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.body}>
      {exposure && (
        <>
          <ChipGroup
            legend="Quem consumiu?"
            options={FOOD_CONSUMERS.map((o) => ({ value: o.value, label: o.label }))}
            value={consumer}
            onChange={(value) => setConsumer((value ?? 'child') as FoodConsumer)}
            clearable={false}
          />
          <Input label="O que foi?" value={food} onChange={(e) => setFood(e.target.value)} />
          <Input label="Marca (opcional)" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <ChipGroup
            legend="Quantidade (opcional)"
            options={EXPOSURE_AMOUNTS.map((o) => ({ value: o.value, label: o.label }))}
            value={amount || null}
            onChange={(value) => setAmount(value ?? '')}
          />
        </>
      )}

      {diaper && (
        <>
          <ChipGroup
            legend="Sangue"
            options={DIAPER_BLOOD.map((o) => ({ value: o.value, label: o.label }))}
            value={blood}
            onChange={(value) => setBlood((value ?? 'nao') as DiaperBlood)}
            clearable={false}
          />
          <ChipGroup
            legend="Muco"
            options={DIAPER_MUCUS.map((o) => ({ value: o.value, label: o.label }))}
            value={mucus}
            onChange={(value) => setMucus((value ?? 'nao') as DiaperMucus)}
            clearable={false}
          />
          <ChipGroup
            legend="Consistência (opcional)"
            options={DIAPER_CONSISTENCY.map((o) => ({ value: o.value, label: o.label }))}
            value={consistency || null}
            onChange={(value) => setConsistency(value ?? '')}
          />
        </>
      )}

      {symptom && !symptom.no_symptoms && (
        <div className={styles.readonly}>
          <span className={styles.readonlyLabel}>Sintomas registrados</span>
          <p>
            {symptom.items
              .map(
                (item) =>
                  `${SYMPTOM_LABELS.get(item.code) ?? item.code} (${INTENSITY_LABELS.get(
                    item.intensity as 1 | 2 | 3,
                  )})`,
              )
              .join(' · ')}
          </p>
          <p className={styles.hint}>Para trocar os sintomas, exclua e registre de novo.</p>
        </div>
      )}

      {symptom && exposures.length > 0 && (
        <ChipGroup
          legend="Relacionar a uma alimentação (opcional)"
          options={exposures.map((item) => ({
            value: item.id,
            label: item.food,
          }))}
          value={exposureId || null}
          onChange={(value) => setExposureId(value ?? '')}
        />
      )}

      <Input
        label="Data e hora"
        type="datetime-local"
        value={occurredAt}
        onChange={(e) => setOccurredAt(e.target.value)}
      />

      {note ? (
        <Textarea
          label="Observação"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      ) : (
        <Textarea
          label="Observação (opcional)"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}

      {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      <div className={styles.row}>
        <button type="button" className={styles.delete} onClick={() => setConfirmDelete(true)}>
          Excluir registro
        </button>
        <div className={styles.rowRight}>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button busy={state === 'saving'} onClick={() => void save()}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}
