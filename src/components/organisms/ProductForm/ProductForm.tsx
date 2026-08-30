import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Alert } from '@/components/molecules/Alert'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { PRODUCT_CATEGORIES } from '@/constants/products'
import { productSchema } from '@/schemas/product.schema'
import type { ProductValues } from '@/schemas/product.schema'
import { toDateTimeLocalValue } from '@/utils/dates'
import type { ActionState } from '@/types'
import styles from './ProductForm.module.css'

const CATEGORY_CHIPS = PRODUCT_CATEGORIES.map((o) => ({ value: o.value, label: o.label }))
const IS_NEW_CHIPS = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
]

type Props = {
  state: ActionState
  errorMessage?: string
  onSubmit: (values: ProductValues) => void
}

export function ProductForm({ state, errorMessage, onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category: undefined,
      isNew: '',
      name: '',
      brand: '',
      occurredAt: toDateTimeLocalValue(),
      note: '',
    },
  })

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <ChipGroup
            legend="O que foi usado?"
            options={CATEGORY_CHIPS}
            value={field.value ?? null}
            onChange={(value) => field.onChange(value ?? undefined)}
            clearable={false}
          />
        )}
      />
      {errors.category?.message && <Alert variant="error">{errors.category.message}</Alert>}

      <Controller
        control={control}
        name="isNew"
        render={({ field }) => (
          <ChipGroup
            legend="É um produto novo?"
            options={IS_NEW_CHIPS}
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
          <Input label="Nome do produto (opcional)" autoComplete="off" {...register('name')} />
          <Input label="Marca (opcional)" autoComplete="off" {...register('brand')} />
          <Input
            label="Data e hora"
            type="datetime-local"
            error={errors.occurredAt?.message}
            {...register('occurredAt')}
          />
          <Textarea
            label="Observação (opcional)"
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
