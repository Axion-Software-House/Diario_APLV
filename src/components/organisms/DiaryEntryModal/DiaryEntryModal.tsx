import { useRef, useState } from 'react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { Modal } from '@/components/organisms/Modal'
import { DIAPER_BLOOD, DIAPER_CONSISTENCY, DIAPER_MUCUS } from '@/constants/diaper'
import { ENVIRONMENT_PLACE_LABELS, ENVIRONMENT_PLACES } from '@/constants/environments'
import {
  EXPOSURE_AMOUNTS,
  EXPOSURE_DAIRY_OPTIONS,
  EXPOSURE_TPO_OPTIONS,
  FOOD_CONSUMERS,
} from '@/constants/exposure'
import {
  formatWeightKg,
  hasLargeWeightVariation,
  MEDICATION_DURATION_OPTIONS,
  MEDICATION_INTERVAL_OPTIONS,
  parseWeightKg,
  readHealthData,
  validateWeightKg,
} from '@/constants/health'
import type { HealthData, MedicationDurationMode } from '@/constants/health'
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from '@/constants/products'
import {
  INTENSITIES,
  SYMPTOMS,
  SYMPTOM_EVOLUTION_LABELS,
  SYMPTOM_EVOLUTION_OPTIONS,
} from '@/constants/symptoms'
import { useAuth } from '@/hooks/useAuth'
import { useChild } from '@/hooks/useChild'
import { useEntryMutation } from '@/hooks/useEntryMutation'
import { deleteExposure, updateExposure } from '@/services/exposures'
import { deleteDiaperRecord, updateDiaperRecord } from '@/services/diapers'
import { deleteEnvironmentRecord, updateEnvironmentRecord } from '@/services/environments'
import { deleteHealthRecord, updateHealthRecord } from '@/services/health'
import { deleteNote, updateNote } from '@/services/notes'
import { deleteProductRecord, updateProductRecord } from '@/services/products'
import {
  createSymptomEvolution,
  deleteSymptomEvent,
  deleteSymptomEvolution,
  updateSymptomEvent,
} from '@/services/symptoms'
import {
  formatDateTime,
  fromDateTimeLocalValue,
  isNotInFuture,
  toDateTimeLocalValue,
} from '@/utils/dates'
import { minuteFloor, stageAssignmentAt, stageAtTime } from '@/utils/stagePeriods'
import type { StageAssignment } from '@/utils/stagePeriods'
import type { TimelineSources } from '@/utils/timeline'
import type {
  DiaperBlood,
  DiaperConsistency,
  DiaperMucus,
  Exposure,
  ExposureDairy,
  FoodConsumer,
  SymptomEvolution,
  SymptomEvolutionStatus,
  TimelineEvent,
  TimelineKind,
} from '@/types'
import styles from './DiaryEntryModal.module.css'

const SYMPTOM_LABELS = new Map(SYMPTOMS.map((symptom) => [symptom.code, symptom.label]))
const INTENSITY_LABELS = new Map(INTENSITIES.map((item) => [item.value, item.label]))
const PRESET_HOURS = new Set([3, 4, 6, 8, 12, 24])

const KIND_LABELS: Record<TimelineKind, string> = {
  exposure: 'Alimentação',
  symptom: 'Sintomas',
  no_symptoms: 'Tudo tranquilo',
  diaper: 'Fralda',
  note: 'Observação',
  product: 'Produto / Higiene',
  environment: 'Ambiente / Visita',
  health: 'Saúde',
  stage: 'Etapa',
}

type Props = {
  entry: TimelineEvent | null
  mode?: 'edit' | 'delete'
  sources: TimelineSources
  exposures: readonly Exposure[]
  onClose: () => void
  onSaved: () => void
}

/** Editar / excluir um registro do Diário. O histórico do TPO não chega aqui. */
export function DiaryEntryModal({
  entry,
  mode = 'edit',
  sources,
  exposures,
  onClose,
  onSaved,
}: Props) {
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null)
  const entryKey = entry ? `${entry.kind}-${entry.id}` : null
  const confirmDelete = mode === 'delete' || (entryKey !== null && confirmingKey === entryKey)

  function handleClose() {
    setConfirmingKey(null)
    onClose()
  }

  return (
    <Modal
      open={entry !== null}
      title={confirmDelete ? 'Excluir registro?' : 'Editar registro'}
      onClose={handleClose}
      dismissOnBackdrop={false}
    >
      {entry && (
        <Editor
          key={`${entry.kind}-${entry.id}-${mode}`}
          entry={entry}
          sources={sources}
          exposures={exposures}
          confirmDelete={confirmDelete}
          onRequestDelete={() => setConfirmingKey(entryKey)}
          onCancelDelete={() => {
            if (mode === 'delete') handleClose()
            else setConfirmingKey(null)
          }}
          onClose={handleClose}
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
  confirmDelete,
  onRequestDelete,
  onCancelDelete,
  onClose,
  onSaved,
}: Omit<Props, 'mode'> & {
  entry: TimelineEvent
  confirmDelete: boolean
  onRequestDelete: () => void
  onCancelDelete: () => void
}) {
  const { user } = useAuth()
  const { activeTpo } = useChild()
  const { state, errorMessage, run } = useEntryMutation()

  const exposure = sources.exposures.find((item) => item.id === entry.id)
  const diaper = sources.diaperRecords.find((item) => item.id === entry.id)
  const note = sources.notes.find((item) => item.id === entry.id)
  const symptom = sources.symptomEvents.find((item) => item.id === entry.id)
  const product = sources.productRecords.find((item) => item.id === entry.id)
  const environment = sources.environmentRecords.find((item) => item.id === entry.id)
  const health = sources.healthRecords.find((item) => item.id === entry.id)
  const record = exposure ?? diaper ?? note ?? symptom ?? product ?? environment ?? health
  const healthData = health ? readHealthData(health) : {}

  const recentEnvironments = sources.environmentRecords.slice(0, 8)
  const recentProducts = sources.productRecords.slice(0, 8)

  const previousWeightRecord =
    health?.kind === 'weight'
      ? sources.healthRecords.find(
          (item) =>
            item.id !== health.id &&
            item.kind === 'weight' &&
            typeof readHealthData(item).kg === 'number',
        )
      : undefined
  const previousWeightKg = previousWeightRecord ? readHealthData(previousWeightRecord).kg : null

  const [occurredAt, setOccurredAt] = useState(
    toDateTimeLocalValue(record?.occurred_at ?? new Date()),
  )
  const [text, setText] = useState(
    exposure?.note ??
      diaper?.note ??
      note?.content ??
      symptom?.note ??
      product?.note ??
      environment?.note ??
      '',
  )
  const [category, setCategory] = useState<string>(product?.category ?? '')
  const [productName, setProductName] = useState(product?.name ?? '')
  const [productBrand, setProductBrand] = useState(product?.brand ?? '')
  const [isNew, setIsNew] = useState<string>(
    product?.is_new === true ? 'sim' : product?.is_new === false ? 'nao' : '',
  )
  const [place, setPlace] = useState<string>(environment?.place ?? '')
  const [different, setDifferent] = useState(environment?.different ?? '')
  const [healthTitle, setHealthTitle] = useState(health?.title ?? '')
  const [dose, setDose] = useState(healthData.dose ?? '')
  const initialHours = healthData.intervalHours
  const [intervalChoice, setIntervalChoice] = useState<string>(
    typeof initialHours === 'number'
      ? PRESET_HOURS.has(initialHours)
        ? String(initialHours)
        : 'custom'
      : '8',
  )
  const [customHours, setCustomHours] = useState(
    typeof initialHours === 'number' && !PRESET_HOURS.has(initialHours)
      ? String(initialHours)
      : '',
  )
  const [durationMode, setDurationMode] = useState<MedicationDurationMode>(
    healthData.durationMode ?? 'days',
  )
  const [durationDays, setDurationDays] = useState(
    healthData.durationDays != null ? String(healthData.durationDays) : '5',
  )
  const [reaction, setReaction] = useState(healthData.reaction ?? '')
  const [guidance, setGuidance] = useState(healthData.guidance ?? '')
  const [questions, setQuestions] = useState(healthData.questions ?? '')
  const [kg, setKg] = useState(healthData.kg != null ? String(healthData.kg).replace('.', ',') : '')
  const [localError, setLocalError] = useState<string>()
  const [confirmingWeight, setConfirmingWeight] = useState(false)
  const [consumer, setConsumer] = useState<FoodConsumer>(exposure?.consumer ?? 'child')
  const [food, setFood] = useState(exposure?.food ?? '')
  const [isTpoFood, setIsTpoFood] = useState<string>(
    exposure?.stage != null ? 'sim' : 'nao',
  )
  const [tpoFoodNotice, setTpoFoodNotice] = useState(false)
  const [containsDairy, setContainsDairy] = useState<string>(exposure?.contains_dairy ?? '')
  const [amount, setAmount] = useState<string>(exposure?.amount ?? '')
  const [brand, setBrand] = useState(exposure?.brand ?? '')
  const [blood, setBlood] = useState<DiaperBlood>(diaper?.blood ?? 'nao')
  const [mucus, setMucus] = useState<DiaperMucus>(diaper?.mucus ?? 'nao')
  const [consistency, setConsistency] = useState<string>(diaper?.consistency ?? '')
  const [exposureId, setExposureId] = useState<string>(symptom?.exposure_id ?? '')
  const [environmentId, setEnvironmentId] = useState<string>(symptom?.environment_id ?? '')
  const [productId, setProductId] = useState<string>(symptom?.product_id ?? '')

  const [evolutionStatus, setEvolutionStatus] = useState<SymptomEvolutionStatus | null>(null)
  const [evolutionOccurredAt, setEvolutionOccurredAt] = useState(toDateTimeLocalValue())
  const [evolutionNote, setEvolutionNote] = useState('')

  if (!record) {
    return <p className={styles.gone}>Este registro não está mais disponível.</p>
  }

  const trimmed = text.trim()
  const recordOccurredAt = record.occurred_at
  const recordProtocolId = record.protocol_id

  // "É o alimento do TPO?": a etapa gravada é a vigente na DATA do registro,
  // segundo o histórico do protocolo — nunca a etapa de hoje.
  const tpoProtocolId = exposure ? (exposure.protocol_id ?? activeTpo?.protocol.id ?? null) : null
  const tpoPeriods = tpoProtocolId
    ? sources.stageHistory.filter((period) => period.protocol_id === tpoProtocolId)
    : []
  // Comparação por timestamp: `started_at` volta com offset de fuso.
  const tpoStart = tpoPeriods.reduce<string | null>(
    (earliest, period) =>
      earliest === null || new Date(period.started_at).getTime() < new Date(earliest).getTime()
        ? period.started_at
        : earliest,
    null,
  )
  const occurredAtIso =
    occurredAt && !Number.isNaN(new Date(occurredAt).getTime())
      ? fromDateTimeLocalValue(occurredAt)
      : null
  const stageAtDate = occurredAtIso ? stageAtTime(tpoPeriods, occurredAtIso) : null
  const tpoUnavailableMessage =
    tpoProtocolId && occurredAtIso && stageAtDate === null
      ? tpoStart && new Date(occurredAtIso).getTime() < minuteFloor(tpoStart)
        ? `A data deste registro é anterior ao início do TPO (${formatDateTime(tpoStart)}). Só registros a partir dessa data podem ser marcados como alimento do TPO.`
        : 'A data deste registro está fora do período do TPO. Só registros feitos durante o TPO podem ser marcados como alimento do TPO.'
      : undefined

  async function save() {
    if (!occurredAt || Number.isNaN(new Date(occurredAt).getTime())) {
      setLocalError('Informe a data e a hora.')
      return
    }
    if (health?.kind !== 'appointment' && !isNotInFuture(occurredAt)) {
      setLocalError('A data não pode estar no futuro.')
      return
    }
    if (symptom && evolutionStatus) {
      if (!evolutionOccurredAt || Number.isNaN(new Date(evolutionOccurredAt).getTime())) {
        setLocalError('Informe a data e a hora da evolução.')
        return
      }
      if (!isNotInFuture(evolutionOccurredAt)) {
        setLocalError('A data da evolução não pode estar no futuro.')
        return
      }
    }

    const at = fromDateTimeLocalValue(occurredAt)
    const dateChanged = occurredAt !== toDateTimeLocalValue(recordOccurredAt)
    // Mudou a data: o registro passa à etapa vigente na NOVA data, como na
    // criação (useRecordWrite). Vale o protocolo do próprio registro e, se a
    // nova data não cair nele (ou ele não tiver protocolo), o TPO ativo. Fora
    // de qualquer etapa, protocolo e etapa ficam vazios. Sem mudança de data,
    // o patch não traz as colunas e a etapa gravada fica como está.
    // A alimentação tem regra própria ("É o alimento do TPO?"), logo abaixo.
    const stageAtNewDate: Partial<StageAssignment> = dateChanged
      ? stageAssignmentAt(sources.stageHistory, [recordProtocolId, activeTpo?.protocol.id], at)
      : {}

    let ok = false
    if (exposure) {
      const linkToTpo = isTpoFood === 'sim'
      const wasLinked = exposure.stage != null
      // Registro que já era do TPO e não mudou de data mantém a etapa gravada;
      // marcar agora ou mudar a data recalcula pela etapa vigente na data.
      const keepStage = linkToTpo && wasLinked && !dateChanged
      if (linkToTpo && !keepStage && (stageAtDate === null || !tpoProtocolId)) {
        // A explicação já aparece junto da pergunta; aqui só aponta o campo.
        setLocalError(
          tpoUnavailableMessage
            ? 'Confira a resposta de "É o alimento do TPO?".'
            : 'Não há TPO para vincular este registro.',
        )
        return
      }
      ok = await run(() =>
        updateExposure(exposure.id, {
          consumer,
          food: food.trim(),
          containsDairy: (containsDairy || null) as ExposureDairy | null,
          amount: (amount || null) as Exposure['amount'],
          brand: brand.trim() || null,
          details: exposure.details,
          occurredAt: at,
          note: trimmed || null,
          protocolId: linkToTpo ? (keepStage ? exposure.protocol_id : tpoProtocolId) : null,
          stage: linkToTpo ? (keepStage ? exposure.stage : stageAtDate) : null,
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
          ...stageAtNewDate,
        }),
      )
    } else if (note) {
      ok = await run(() =>
        updateNote(note.id, { content: trimmed, occurredAt: at, ...stageAtNewDate }),
      )
    } else if (symptom) {
      ok = await run(async () => {
        await updateSymptomEvent(symptom.id, {
          occurredAt: at,
          exposureId: exposureId || null,
          environmentId: environmentId || null,
          productId: productId || null,
          note: trimmed || null,
          ...stageAtNewDate,
        })
        if (evolutionStatus && user) {
          await createSymptomEvolution({
            userId: user.id,
            childId: symptom.child_id,
            symptomEventId: symptom.id,
            occurredAt: fromDateTimeLocalValue(evolutionOccurredAt),
            status: evolutionStatus,
            note: evolutionNote.trim() || null,
          })
        }
      })
    } else if (product) {
      ok = await run(() =>
        updateProductRecord(product.id, {
          category,
          isNew: isNew === 'sim' ? true : isNew === 'nao' ? false : null,
          name: productName.trim() || null,
          brand: productBrand.trim() || null,
          occurredAt: at,
          note: trimmed || null,
          ...stageAtNewDate,
        }),
      )
    } else if (environment) {
      ok = await run(() =>
        updateEnvironmentRecord(environment.id, {
          place,
          different: different.trim() || null,
          occurredAt: at,
          note: trimmed || null,
          ...stageAtNewDate,
        }),
      )
    } else if (health) {
      const data: HealthData = {}
      if (health.kind === 'medication') {
        if (healthData.entryType) data.entryType = healthData.entryType
        if (dose.trim()) data.dose = dose.trim()
        if (healthData.entryType === 'treatment') {
          const parsedHours =
            intervalChoice === 'custom'
              ? Number(customHours.replace(',', '.'))
              : Number(intervalChoice)
          if (!Number.isNaN(parsedHours) && parsedHours > 0) data.intervalHours = parsedHours
          data.durationMode = durationMode
          if (durationMode === 'days') {
            const parsedDays = Number(durationDays)
            if (!Number.isNaN(parsedDays) && parsedDays >= 1) {
              data.durationDays = Math.round(parsedDays)
            }
          }
          if (healthData.endedAt) data.endedAt = healthData.endedAt
        } else if (healthData.entryType === 'dose') {
          if (healthData.treatmentId) data.treatmentId = healthData.treatmentId
          if (typeof healthData.intervalHours === 'number') {
            data.intervalHours = healthData.intervalHours
          }
        }
      }
      if (health.kind === 'vaccine' && reaction.trim()) data.reaction = reaction.trim()
      if (health.kind === 'appointment') {
        if (guidance.trim()) data.guidance = guidance.trim()
        if (questions.trim()) data.questions = questions.trim()
      }
      if (health.kind === 'weight') {
        const weightError = validateWeightKg(kg)
        if (weightError) {
          setLocalError(weightError)
          setConfirmingWeight(false)
          return
        }
        const value = parseWeightKg(kg)
        if (hasLargeWeightVariation(value, previousWeightKg) && !confirmingWeight) {
          setLocalError(undefined)
          setConfirmingWeight(true)
          return
        }
        setLocalError(undefined)
        setConfirmingWeight(false)
        data.kg = value
      }
      ok = await run(() =>
        updateHealthRecord(health.id, {
          title: health.kind === 'weight' ? null : healthTitle.trim() || null,
          data,
          occurredAt: at,
          note: trimmed || null,
          ...stageAtNewDate,
        }),
      )
    }
    if (ok) {
      onSaved()
      onClose()
    }
  }

  async function removeEvolution(evolutionId: string) {
    const ok = await run(() => deleteSymptomEvolution(evolutionId))
    if (ok) onSaved()
    return ok
  }

  async function remove() {
    let ok = false
    if (exposure) ok = await run(() => deleteExposure(exposure.id))
    else if (diaper) ok = await run(() => deleteDiaperRecord(diaper.id))
    else if (note) ok = await run(() => deleteNote(note.id))
    else if (symptom) ok = await run(() => deleteSymptomEvent(symptom.id))
    else if (product) ok = await run(() => deleteProductRecord(product.id))
    else if (environment) ok = await run(() => deleteEnvironmentRecord(environment.id))
    else if (health) ok = await run(() => deleteHealthRecord(health.id))
    if (ok) {
      onSaved()
      onClose()
    }
  }

  if (confirmDelete) {
    return (
      <div className={styles.body}>
        <div className={styles.readonly}>
          <span className={styles.readonlyLabel}>
            {KIND_LABELS[entry.kind]} · {formatDateTime(entry.occurredAt)}
          </span>
          <p className={styles.summaryTitle}>{entry.title}</p>
          {entry.detail && <p className={styles.hint}>{entry.detail}</p>}
        </div>
        <p className={styles.confirmText}>Esta ação não pode ser desfeita.</p>
        {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
        <div className={styles.row}>
          <div className={styles.rowRight}>
            <Button variant="ghost" onClick={onCancelDelete}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              busy={state === 'saving'}
              busyLabel="Excluindo..."
              onClick={() => void remove()}
            >
              Excluir
            </Button>
          </div>
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
          {(activeTpo !== null || exposure.stage !== null) && (
            <ChipGroup
              legend="É o alimento do TPO?"
              options={EXPOSURE_TPO_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={isTpoFood}
              onChange={(value) => {
                const next = value ?? 'nao'
                // Fora do período do TPO não há etapa para gravar: o "Sim" não
                // é aceito e a explicação aparece logo abaixo.
                if (next === 'sim' && tpoUnavailableMessage) {
                  setTpoFoodNotice(true)
                  return
                }
                setTpoFoodNotice(false)
                setLocalError(undefined)
                setIsTpoFood(next)
              }}
              clearable={false}
            />
          )}
          {tpoUnavailableMessage && (tpoFoodNotice || isTpoFood === 'sim') && (
            <Alert variant="info">{tpoUnavailableMessage}</Alert>
          )}
          <ChipGroup
            legend="Continha leite ou derivados?"
            options={EXPOSURE_DAIRY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={containsDairy || null}
            onChange={(value) => setContainsDairy(value ?? '')}
          />
          <Input
            label="Marca (opcional)"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
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

      {product && (
        <>
          <ChipGroup
            legend="O que foi usado?"
            options={PRODUCT_CATEGORIES.map((o) => ({ value: o.value, label: o.label }))}
            value={category || null}
            onChange={(value) => setCategory(value ?? '')}
            clearable={false}
          />
          <ChipGroup
            legend="É um produto novo?"
            options={[
              { value: 'sim', label: 'Sim' },
              { value: 'nao', label: 'Não' },
            ]}
            value={isNew || null}
            onChange={(value) => setIsNew(value ?? '')}
          />
          <Input
            label="Nome do produto (opcional)"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
          <Input
            label="Marca (opcional)"
            value={productBrand}
            onChange={(e) => setProductBrand(e.target.value)}
          />
        </>
      )}

      {environment && (
        <>
          <ChipGroup
            legend="Onde vocês estiveram?"
            options={ENVIRONMENT_PLACES.map((o) => ({ value: o.value, label: o.label }))}
            value={place || null}
            onChange={(value) => setPlace(value ?? '')}
            clearable={false}
          />
          <Textarea
            label="Teve algo diferente do habitual? (opcional)"
            rows={3}
            value={different}
            onChange={(e) => setDifferent(e.target.value)}
          />
        </>
      )}

      {health && (
        <>
          {health.kind !== 'weight' && (
            <Input
              label={health.kind === 'appointment' ? 'Especialidade' : 'Nome'}
              value={healthTitle}
              onChange={(e) => setHealthTitle(e.target.value)}
            />
          )}
          {health.kind === 'medication' && (
            <>
              <Input
                label={healthData.entryType === 'treatment' ? 'Dose prescrita' : 'Dose (opcional)'}
                value={dose}
                onChange={(e) => setDose(e.target.value)}
              />
              {healthData.entryType === 'treatment' && (
                <>
                  <ChipGroup
                    legend="Intervalo entre as doses"
                    options={MEDICATION_INTERVAL_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    value={intervalChoice}
                    onChange={(value) => setIntervalChoice(value ?? '8')}
                    clearable={false}
                  />
                  {intervalChoice === 'custom' && (
                    <Input
                      label="A cada quantas horas?"
                      inputMode="decimal"
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                    />
                  )}
                  <ChipGroup
                    legend="Duração do tratamento"
                    options={MEDICATION_DURATION_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    value={durationMode}
                    onChange={(value) =>
                      setDurationMode((value ?? 'days') as MedicationDurationMode)
                    }
                    clearable={false}
                  />
                  {durationMode === 'days' && (
                    <Input
                      label="Por quantos dias?"
                      inputMode="numeric"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                    />
                  )}
                </>
              )}
            </>
          )}
          {health.kind === 'vaccine' && (
            <Textarea
              label="Reação percebida (opcional)"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
            />
          )}
          {health.kind === 'appointment' && (
            <>
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
            </>
          )}
          {health.kind === 'weight' && (
            <Input
              label="Peso (kg)"
              inputMode="decimal"
              value={kg}
              onChange={(e) => {
                setKg(e.target.value)
                setLocalError(undefined)
                setConfirmingWeight(false)
              }}
            />
          )}
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

      {symptom && recentEnvironments.length > 0 && (
        <ChipGroup
          legend="Relacionar a um ambiente ou visita (opcional)"
          options={recentEnvironments.map((item) => ({
            value: item.id,
            label: `${ENVIRONMENT_PLACE_LABELS.get(item.place) ?? item.place} · ${formatDateTime(item.occurred_at)}`,
          }))}
          value={environmentId || null}
          onChange={(value) => setEnvironmentId(value ?? '')}
        />
      )}

      {symptom && recentProducts.length > 0 && (
        <ChipGroup
          legend="Relacionar a um produto (opcional)"
          options={recentProducts.map((item) => ({
            value: item.id,
            label: `${item.name || (PRODUCT_CATEGORY_LABELS.get(item.category) ?? item.category)} · ${formatDateTime(item.occurred_at)}`,
          }))}
          value={productId || null}
          onChange={(value) => setProductId(value ?? '')}
        />
      )}

      {symptom && !symptom.no_symptoms && (
        <div className={styles.evolutionSection}>
          <span className={styles.readonlyLabel}>Evolução do episódio</span>
          {symptom.evolutions && symptom.evolutions.length > 0 && (
            <ul className={styles.evolutionList}>
              {symptom.evolutions.map((evo) => (
                <EvolutionRow
                  key={evo.id}
                  evolution={evo}
                  busy={state === 'saving'}
                  onRemove={() => removeEvolution(evo.id)}
                />
              ))}
            </ul>
          )}

          <ChipGroup
            legend="Registrar evolução (opcional)"
            options={SYMPTOM_EVOLUTION_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            value={evolutionStatus}
            onChange={(value) => setEvolutionStatus((value as SymptomEvolutionStatus) ?? null)}
          />

          {evolutionStatus && (
            <>
              <Input
                label="Quando evoluiu?"
                type="datetime-local"
                value={evolutionOccurredAt}
                onChange={(e) => {
                  setEvolutionOccurredAt(e.target.value)
                  setLocalError(undefined)
                }}
              />
              <Input
                label="Nota da evolução (opcional)"
                value={evolutionNote}
                onChange={(e) => setEvolutionNote(e.target.value)}
              />
            </>
          )}
        </div>
      )}

      <Input
        label="Data e hora"
        type="datetime-local"
        value={occurredAt}
        onChange={(e) => {
          setOccurredAt(e.target.value)
          setLocalError(undefined)
        }}
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

      {localError && <Alert variant="error">{localError}</Alert>}
      {confirmingWeight && previousWeightKg != null && (
        <Alert variant="info">
          O último peso registrado foi {formatWeightKg(previousWeightKg)} kg. Confira se é{' '}
          {formatWeightKg(parseWeightKg(kg))} kg mesmo e toque em confirmar para salvar.
        </Alert>
      )}
      {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      <div className={styles.row}>
        <button type="button" className={styles.delete} onClick={onRequestDelete}>
          Excluir registro
        </button>
        <div className={styles.rowRight}>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button busy={state === 'saving'} onClick={() => void save()}>
            {confirmingWeight ? `Confirmar ${formatWeightKg(parseWeightKg(kg))} kg` : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Uma evolução do episódio. Remover pede um segundo toque no mesmo botão
 * ("Confirmar remoção"), sem abrir outro modal por cima deste. O foco fica
 * no botão o tempo todo, e volta para ele quando a remoção é cancelada.
 */
function EvolutionRow({
  evolution,
  busy,
  onRemove,
}: {
  evolution: SymptomEvolution
  busy: boolean
  onRemove: () => Promise<boolean>
}) {
  const [confirming, setConfirming] = useState(false)
  const removeRef = useRef<HTMLButtonElement>(null)
  const statusLabel = SYMPTOM_EVOLUTION_LABELS.get(evolution.status) ?? evolution.status
  const when = formatDateTime(evolution.occurred_at)

  async function handleRemove() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    const ok = await onRemove()
    if (!ok) setConfirming(false)
  }

  return (
    <li className={styles.evolutionRow}>
      <span>
        <strong>{statusLabel}</strong> em {when}
        {evolution.note ? ` — ${evolution.note}` : ''}
      </span>
      <span className={styles.evolutionActions}>
        <button
          key="remove"
          ref={removeRef}
          type="button"
          className={styles.evolutionRemove}
          data-confirming={confirming}
          disabled={busy}
          aria-label={
            confirming
              ? `Confirmar remoção da evolução "${statusLabel}" de ${when}`
              : `Remover a evolução "${statusLabel}" de ${when}`
          }
          onClick={() => void handleRemove()}
        >
          {confirming ? 'Confirmar remoção' : 'Remover'}
        </button>
        {confirming && (
          <button
            key="cancel"
            type="button"
            className={styles.evolutionCancel}
            disabled={busy}
            onClick={() => {
              setConfirming(false)
              removeRef.current?.focus()
            }}
          >
            Cancelar
          </button>
        )}
      </span>
    </li>
  )
}
