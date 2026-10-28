import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import {
  EXPOSURE_AMOUNTS,
  EXPOSURE_DAIRY_OPTIONS,
  EXPOSURE_TPO_OPTIONS,
  FOOD_CONSUMERS,
} from '@/constants/exposure'
import { exposureSchemaFor } from '@/schemas/exposure.schema'
import type { ExposureValues } from '@/schemas/exposure.schema'
import { toDateTimeLocalValue } from '@/utils/dates'
import type { ActionState } from '@/types'
import styles from './ExposureForm.module.css'

const AMOUNT_CHIPS = EXPOSURE_AMOUNTS.map((option) => ({ value: option.value, label: option.label }))
const CONSUMER_CHIPS = FOOD_CONSUMERS.map((option) => ({ value: option.value, label: option.label }))
const DAIRY_CHIPS = EXPOSURE_DAIRY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}))
const TPO_CHIPS = EXPOSURE_TPO_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}))

type Props = {
  state: ActionState
  errorMessage?: string
  hasActiveTpo?: boolean
  onSubmit: (values: ExposureValues) => void
}

export function ExposureForm({ state, errorMessage, hasActiveTpo = false, onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExposureValues>({
    resolver: zodResolver(exposureSchemaFor(hasActiveTpo)),
    defaultValues: {
      consumer: 'child',
      food: '',
      // Com TPO ativo, as duas perguntas começam sem resposta: quem informa
      // é a família, nunca um valor presumido pelo app.
      isTpoFood: '',
      containsDairy: '',
      amount: '',
      brand: '',
      details: '',
      // Horário real, preenchido sozinho: a usuária só mexe se precisar corrigir.
      occurredAt: toDateTimeLocalValue(),
      note: '',
    },
  })

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller
        control={control}
        name="consumer"
        render={({ field }) => (
          <ChipGroup
            legend="Quem consumiu?"
            options={CONSUMER_CHIPS}
            value={field.value}
            onChange={(value) => field.onChange(value ?? 'child')}
            clearable={false}
          />
        )}
      />

      <Input
        label="O que foi?"
        placeholder="Ex.: bolo simples, iogurte, queijo"
        autoComplete="off"
        error={errors.food?.message}
        {...register('food')}
      />

      {hasActiveTpo && (
        <>
          <Controller
            control={control}
            name="isTpoFood"
            render={({ field }) => (
              <ChipGroup
                legend="É o alimento do TPO?"
                options={TPO_CHIPS}
                value={field.value || null}
                onChange={(value) => field.onChange(value ?? '')}
                clearable={false}
              />
            )}
          />
          {errors.isTpoFood?.message && <Alert variant="error">{errors.isTpoFood.message}</Alert>}
        </>
      )}

      <Controller
        control={control}
        name="containsDairy"
        render={({ field }) => (
          <ChipGroup
            legend="Continha leite ou derivados?"
            options={DAIRY_CHIPS}
            value={field.value || null}
            onChange={(value) => field.onChange(value ?? '')}
          />
        )}
      />

      <details className={styles.details}>
        <summary className={styles.summary}>
          <Plus size={16} aria-hidden="true" />
          Adicionar detalhes
        </summary>

        <div className={styles.detailsBody}>
          <Input label="Marca (opcional)" autoComplete="off" {...register('brand')} />

          <Textarea
            label="Ingredientes ou detalhes (opcional)"
            rows={2}
            error={errors.details?.message}
            {...register('details')}
          />

          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <ChipGroup
                legend="Quantidade (opcional)"
                options={AMOUNT_CHIPS}
                value={field.value || null}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />

          <Input
            label="Data e hora"
            type="datetime-local"
            error={errors.occurredAt?.message}
            {...register('occurredAt')}
          />

          <Textarea
            label="Observação (opcional)"
            hint="Só o que você observou. Não é preciso interpretar."
            error={errors.note?.message}
            {...register('note')}
          />
        </div>
      </details>

      <div aria-live="polite">
        {state === 'error' && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      </div>

      <Button type="submit" busy={state === 'saving'}>
        Salvar registro
      </Button>
    </form>
  )
}
