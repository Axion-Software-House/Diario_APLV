import { ProtocolTemplate } from '@/components/templates/ProtocolTemplate'
import { ProductForm } from '@/components/organisms/ProductForm'
import { useCreateProductRecord } from '@/hooks/useCreateProductRecord'
import { useReturnNavigation } from '@/hooks/useReturnNavigation'
import type { ProductValues } from '@/schemas/product.schema'
import { fromDateTimeLocalValue } from '@/utils/dates'

export default function Product() {
  const { returnAfterSave } = useReturnNavigation()
  const { state, errorMessage, submit } = useCreateProductRecord()

  async function handleSubmit(values: ProductValues) {
    const ok = await submit({
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
      category: values.category,
      isNew: values.isNew === 'sim' ? true : values.isNew === 'nao' ? false : null,
      name: values.name?.trim() || null,
      brand: values.brand?.trim() || null,
      note: values.note?.trim() || null,
    })
    if (ok) returnAfterSave('Produto registrado.')
  }

  return (
    <ProtocolTemplate title="Produto / Higiene" subtitle="O que foi usado na pele da criança.">
      <ProductForm state={state} errorMessage={errorMessage} onSubmit={handleSubmit} />
    </ProtocolTemplate>
  )
}
