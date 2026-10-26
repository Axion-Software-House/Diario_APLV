import { z } from 'zod'
import { EXPOSURE_AMOUNTS, EXPOSURE_DAIRY_OPTIONS, FOOD_CONSUMERS } from '@/constants/exposure'
import { isNotInFuture } from '@/utils/dates'

const AMOUNTS: readonly string[] = EXPOSURE_AMOUNTS.map((option) => option.value)
const CONSUMERS = FOOD_CONSUMERS.map((option) => option.value) as [string, ...string[]]
const DAIRY_VALUES: readonly string[] = EXPOSURE_DAIRY_OPTIONS.map((option) => option.value)

/**
 * README FINAL §5: "quem consumiu", "o que foi" e "continha leite ou derivados?"
 * na primeira tela. Marca, ingredientes, quantidade, observação e data/hora
 * ficam em "+ detalhes".
 */
export const exposureSchema = z.object({
  consumer: z.enum(CONSUMERS),
  food: z
    .string()
    .trim()
    .min(1, 'Informe o que foi consumido.')
    .max(200, 'Use no máximo 200 caracteres.'),
  containsDairy: z
    .string()
    .refine(
      (value) => value === '' || DAIRY_VALUES.includes(value),
      'Informe se continha leite ou derivados.',
    )
    .optional(),
  amount: z
    .string()
    .refine((value) => value === '' || AMOUNTS.includes(value), 'Quantidade inválida.')
    .optional(),
  brand: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
  details: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
  occurredAt: z
    .string()
    .min(1, 'Informe a data e a hora.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Data ou hora inválida.')
    .refine((value) => isNotInFuture(value), 'A data não pode estar no futuro.'),
  note: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
})

export type ExposureValues = z.infer<typeof exposureSchema>
