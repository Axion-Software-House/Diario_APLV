/**
 * Categorias de produto / higiene / cosmético — README FINAL §10.
 * Texto livre no banco (product_records.category); evolui sem migration.
 */
export const PRODUCT_CATEGORIES = [
  { value: 'sabonete', label: 'Sabonete' },
  { value: 'hidratante', label: 'Hidratante' },
  { value: 'lenco', label: 'Lenço umedecido' },
  { value: 'fralda', label: 'Fralda' },
  { value: 'pomada', label: 'Pomada' },
  { value: 'shampoo', label: 'Shampoo' },
  { value: 'protetor', label: 'Protetor solar' },
  { value: 'perfume', label: 'Perfume / Colônia' },
  { value: 'outro', label: 'Outro' },
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]['value']

export const PRODUCT_CATEGORY_LABELS = new Map<string, string>(
  PRODUCT_CATEGORIES.map((option) => [option.value, option.label]),
)
