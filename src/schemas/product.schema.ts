import { z } from 'zod'
import { PRODUCT_CATEGORIES } from '@/constants/products'

const CATEGORIES = PRODUCT_CATEGORIES.map((option) => option.value) as [string, ...string[]]

/**
 * README FINAL §10: categoria e "é novo?" bastam. Nome, marca, data/hora e
 * observação ficam em "+ detalhes".
 */
export const productSchema = z.object({
  category: z.enum(CATEGORIES, { message: 'Escolha o que foi usado.' }),
  isNew: z.enum(['sim', 'nao', '']).optional(),
  name: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
  brand: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
  occurredAt: z
    .string()
    .min(1, 'Informe a data e a hora.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Data ou hora inválida.'),
  note: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
})

export type ProductValues = z.infer<typeof productSchema>
