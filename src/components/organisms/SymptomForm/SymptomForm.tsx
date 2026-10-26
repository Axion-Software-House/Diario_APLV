import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Chip } from '@/components/atoms/Chip'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { SafetyAlert } from '@/components/molecules/SafetyAlert'
import { SymptomRow } from '@/components/molecules/SymptomRow'
import { ENVIRONMENT_PLACE_LABELS } from '@/constants/environments'
import { PRODUCT_CATEGORY_LABELS } from '@/constants/products'
import {
  INTENSITIES,
  SYMPTOMS,
  SYMPTOM_EVOLUTION_LABELS,
  SYMPTOM_EVOLUTION_OPTIONS,
  SYMPTOM_GROUPS,
  SYMPTOM_SCREEN_MESSAGE,
} from '@/constants/symptoms'
import type { Intensity, SymptomGroupId } from '@/constants/symptoms'
import { symptomEventSchema, symptomEvolutionSchema } from '@/schemas/symptom.schema'
import type { SymptomEventValues, SymptomEvolutionValues } from '@/schemas/symptom.schema'
import { formatDateTime, formatElapsed, toDateTimeLocalValue } from '@/utils/dates'
import type {
  ActionState,
  EnvironmentRecord,
  Exposure,
  ProductRecord,
  SymptomEventWithItems,
  SymptomEvolutionStatus,
} from '@/types'
import styles from './SymptomForm.module.css'

const SYMPTOM_LABELS = new Map(SYMPTOMS.map((symptom) => [symptom.code, symptom.label]))
const INTENSITY_LABELS = new Map(INTENSITIES.map((item) => [item.value, item.label]))

function describeSymptomEvent(event: SymptomEventWithItems): string {
  const labels = event.items.map((item) => {
    const label = SYMPTOM_LABELS.get(item.code) ?? item.code
    const intensity = INTENSITY_LABELS.get(item.intensity as Intensity)
    return intensity ? `${label} (${intensity})` : label
  })
  return labels.length > 0 ? labels.join(' · ') : 'Sintomas registrados'
}

function describeEnvironmentOption(record: EnvironmentRecord): string {
  const place = ENVIRONMENT_PLACE_LABELS.get(record.place) ?? record.place
  return record.different ? `${place} (${record.different})` : place
}

function describeProductOption(record: ProductRecord): string {
  const category = PRODUCT_CATEGORY_LABELS.get(record.category) ?? record.category
  return record.name ? `${category}: ${record.name}` : category
}

type Props = {
  state: ActionState
  errorMessage?: string
  /** Vínculo opcional com uma alimentação já registrada. */
  exposures: readonly Exposure[]
  /** Vínculo opcional com um ambiente ou visita já registrado. */
  environments?: readonly EnvironmentRecord[]
  /** Vínculo opcional com um produto ou higiene já registrado. */
  products?: readonly ProductRecord[]
  /** Episódios recentes de sintomas para registrar evolução. */
  symptomEvents?: readonly SymptomEventWithItems[]
  evolutionState?: ActionState
  evolutionErrorMessage?: string
  onSubmit: (values: SymptomEventValues) => void
  onSubmitEvolution?: (values: SymptomEvolutionValues) => void
}

export function SymptomForm({
  state,
  errorMessage,
  exposures,
  environments = [],
  products = [],
  symptomEvents = [],
  evolutionState = 'idle',
  evolutionErrorMessage,
  onSubmit,
  onSubmitEvolution,
}: Props) {
  const [mode, setMode] = useState<'new' | 'evolution'>('new')

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SymptomEventValues>({
    resolver: zodResolver(symptomEventSchema),
    defaultValues: {
      items: {},
      otherText: '',
      occurredAt: toDateTimeLocalValue(),
      exposureId: '',
      environmentId: '',
      productId: '',
      note: '',
    },
  })

  const {
    register: registerEvolution,
    control: controlEvolution,
    handleSubmit: handleSubmitEvolution,
    formState: { errors: evolutionErrors },
  } = useForm<SymptomEvolutionValues>({
    resolver: zodResolver(symptomEvolutionSchema),
    defaultValues: {
      symptomEventId: symptomEvents[0]?.id ?? '',
      status: undefined,
      occurredAt: toDateTimeLocalValue(),
      note: '',
    },
  })

  const [openGroup, setOpenGroup] = useState<SymptomGroupId | null>(null)

  const items = useWatch({ control, name: 'items' })
  const occurredAt = useWatch({ control, name: 'occurredAt' })
  const exposureId = useWatch({ control, name: 'exposureId' })
  const environmentId = useWatch({ control, name: 'environmentId' })
  const productId = useWatch({ control, name: 'productId' })
  const selectedEpisodeId = useWatch({ control: controlEvolution, name: 'symptomEventId' })

  const itemsError = typeof errors.items?.message === 'string' ? errors.items.message : undefined
  const alarmSigns = SYMPTOMS.filter((s) => s.alarm && items[s.code]).map((s) => s.label)
  const linkedExposure = exposures.find((exposure) => exposure.id === exposureId)
  const linkedEnvironment = environments.find((env) => env.id === environmentId)
  const linkedProduct = products.find((product) => product.id === productId)
  const selectedEpisode = symptomEvents.find((event) => event.id === selectedEpisodeId)
  const marked = Object.keys(items)
  const otherMarked = Boolean(items.other)
  const canTrackEvolution = symptomEvents.length > 0 && Boolean(onSubmitEvolution)

  function countFor(groupId: SymptomGroupId): number {
    return SYMPTOMS.filter((s) => s.group === groupId && items[s.code]).length
  }

  return (
    <div className={styles.wrapper}>
      {canTrackEvolution && (
        <div className={styles.modes} role="group" aria-label="Tipo de registro de sintoma">
          <Chip selected={mode === 'new'} onClick={() => setMode('new')}>
            Novo sintoma
          </Chip>
          <Chip selected={mode === 'evolution'} onClick={() => setMode('evolution')}>
            Acompanhar evolução
          </Chip>
        </div>
      )}

      {mode === 'evolution' && onSubmitEvolution ? (
        <form
          className={styles.form}
          onSubmit={handleSubmitEvolution(onSubmitEvolution)}
          noValidate
        >
          <Alert variant="info">
            Registre como o episódio evoluiu (se melhorou, ficou igual ou piorou) para formar a
            linha do tempo do acompanhamento.
          </Alert>

          <Controller
            control={controlEvolution}
            name="symptomEventId"
            render={({ field }) => (
              <ChipGroup
                legend="Qual episódio você está acompanhando?"
                options={symptomEvents.map((event) => ({
                  value: event.id,
                  label: `${describeSymptomEvent(event)} · ${formatDateTime(event.occurred_at)}`,
                }))}
                value={field.value || null}
                onChange={(value) => field.onChange(value ?? '')}
                clearable={false}
              />
            )}
          />

          {selectedEpisode && (
            <div className={styles.episodeBox}>
              <span className={styles.episodeLabel}>Linha do tempo do episódio</span>
              <p className={styles.episodeOrigin}>
                Início em {formatDateTime(selectedEpisode.occurred_at)} —{' '}
                {describeSymptomEvent(selectedEpisode)}
              </p>
              {selectedEpisode.evolutions && selectedEpisode.evolutions.length > 0 && (
                <ul className={styles.evolutionHistory}>
                  {selectedEpisode.evolutions.map((item) => (
                    <li key={item.id} className={styles.evolutionHistoryItem}>
                      <strong>{SYMPTOM_EVOLUTION_LABELS.get(item.status) ?? item.status}</strong> em{' '}
                      {formatDateTime(item.occurred_at)}
                      {item.note ? ` — ${item.note}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Controller
            control={controlEvolution}
            name="status"
            render={({ field }) => (
              <ChipGroup
                legend="Como evoluiu?"
                options={SYMPTOM_EVOLUTION_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={field.value ?? null}
                onChange={(value) =>
                  field.onChange((value ?? undefined) as SymptomEvolutionStatus | undefined)
                }
                clearable={false}
              />
            )}
          />

          <Input
            label="Data e hora"
            type="datetime-local"
            error={evolutionErrors.occurredAt?.message}
            {...registerEvolution('occurredAt')}
          />

          <Textarea
            label="Observação (opcional)"
            hint="Só o que você observou nos dias seguintes."
            error={evolutionErrors.note?.message}
            {...registerEvolution('note')}
          />

          <div aria-live="polite">
            {evolutionErrors.symptomEventId?.message && (
              <Alert variant="error">{evolutionErrors.symptomEventId.message}</Alert>
            )}
            {evolutionErrors.status?.message && (
              <Alert variant="error">{evolutionErrors.status.message}</Alert>
            )}
            {evolutionState === 'error' && evolutionErrorMessage && (
              <Alert variant="error">{evolutionErrorMessage}</Alert>
            )}
          </div>

          <Button type="submit" busy={evolutionState === 'saving'}>
            Salvar evolução
          </Button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Alert variant="info">{SYMPTOM_SCREEN_MESSAGE}</Alert>

          <Controller
            control={control}
            name="items"
            render={({ field }) => {
              function setIntensity(code: string, intensity: Intensity | null) {
                const next = { ...field.value }
                if (intensity === null) delete next[code]
                else next[code] = intensity
                field.onChange(next)
              }

              if (openGroup) {
                const group = SYMPTOM_GROUPS.find((g) => g.id === openGroup)
                return (
                  <div className={styles.step}>
                    <button
                      type="button"
                      className={styles.back}
                      onClick={() => setOpenGroup(null)}
                    >
                      <ArrowLeft size={16} aria-hidden="true" />
                      {group?.label}
                    </button>
                    <ul className={styles.rows}>
                      {SYMPTOMS.filter((symptom) => symptom.group === openGroup).map((symptom) => (
                        <SymptomRow
                          key={symptom.code}
                          symptom={symptom}
                          value={(field.value[symptom.code] as Intensity | undefined) ?? null}
                          onChange={(intensity) => setIntensity(symptom.code, intensity)}
                        />
                      ))}
                    </ul>
                  </div>
                )
              }

              return (
                <fieldset className={styles.step}>
                  <legend className={styles.question}>O que você percebeu?</legend>
                  <div className={styles.categories}>
                    {SYMPTOM_GROUPS.map((group) => {
                      const count = countFor(group.id)
                      return (
                        <Chip
                          key={group.id}
                          selected={count > 0}
                          onClick={() => setOpenGroup(group.id)}
                        >
                          {group.label}
                          {count > 0 && <span className={styles.count}> · {count}</span>}
                        </Chip>
                      )
                    })}
                  </div>
                </fieldset>
              )
            }}
          />

          {otherMarked && (
            <Input
              label="O que foi?"
              placeholder="Descreva o sintoma em poucas palavras"
              autoComplete="off"
              error={errors.otherText?.message}
              {...register('otherText')}
            />
          )}

          {marked.length > 0 && (
            <div className={styles.summary} aria-label="Sintomas marcados">
              {marked.map((code) => (
                <span key={code} className={styles.tag}>
                  {SYMPTOM_LABELS.get(code) ?? code}
                  <span className={styles.tagIntensity}>
                    {' '}
                    ({INTENSITY_LABELS.get(items[code] as Intensity)})
                  </span>
                </span>
              ))}
            </div>
          )}

          <SafetyAlert signs={alarmSigns} />

          <Input
            label="Data e hora"
            type="datetime-local"
            error={errors.occurredAt?.message}
            {...register('occurredAt')}
          />

          {exposures.length > 0 && (
            <div className={styles.link}>
              <Controller
                control={control}
                name="exposureId"
                render={({ field }) => (
                  <ChipGroup
                    legend="Relacionar a uma alimentação (opcional)"
                    options={exposures.map((exposure) => ({
                      value: exposure.id,
                      label: `${exposure.food} · ${formatDateTime(exposure.occurred_at)}`,
                    }))}
                    value={field.value || null}
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
              {linkedExposure && (
                <p className={styles.interval}>
                  {new Date(occurredAt) >= new Date(linkedExposure.occurred_at)
                    ? `${formatElapsed(linkedExposure.occurred_at, occurredAt)} após a alimentação`
                    : `${formatElapsed(linkedExposure.occurred_at, occurredAt)} antes da alimentação`}
                </p>
              )}
            </div>
          )}

          {environments.length > 0 && (
            <div className={styles.link}>
              <Controller
                control={control}
                name="environmentId"
                render={({ field }) => (
                  <ChipGroup
                    legend="Relacionar a um ambiente ou visita (opcional)"
                    options={environments.map((env) => ({
                      value: env.id,
                      label: `${describeEnvironmentOption(env)} · ${formatDateTime(env.occurred_at)}`,
                    }))}
                    value={field.value || null}
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
              {linkedEnvironment && (
                <p className={styles.interval}>
                  {new Date(occurredAt) >= new Date(linkedEnvironment.occurred_at)
                    ? `${formatElapsed(linkedEnvironment.occurred_at, occurredAt)} — registrado depois da visita`
                    : `${formatElapsed(linkedEnvironment.occurred_at, occurredAt)} antes da visita`}
                </p>
              )}
            </div>
          )}

          {products.length > 0 && (
            <div className={styles.link}>
              <Controller
                control={control}
                name="productId"
                render={({ field }) => (
                  <ChipGroup
                    legend="Relacionar a um produto (opcional)"
                    options={products.map((product) => ({
                      value: product.id,
                      label: `${describeProductOption(product)} · ${formatDateTime(product.occurred_at)}`,
                    }))}
                    value={field.value || null}
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
              {linkedProduct && (
                <p className={styles.interval}>
                  {new Date(occurredAt) >= new Date(linkedProduct.occurred_at)
                    ? `${formatElapsed(linkedProduct.occurred_at, occurredAt)} — registrado depois do produto`
                    : `${formatElapsed(linkedProduct.occurred_at, occurredAt)} antes do produto`}
                </p>
              )}
            </div>
          )}

          <Textarea
            label="Observação (opcional)"
            hint="Só o que você observou. Não é preciso interpretar."
            error={errors.note?.message}
            {...register('note')}
          />

          <div aria-live="polite">
            {itemsError && <Alert variant="error">{itemsError}</Alert>}
            {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
          </div>

          <Button type="submit" busy={state === 'saving'}>
            Salvar registro
          </Button>
        </form>
      )}
    </div>
  )
}
