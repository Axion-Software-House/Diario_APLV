import { z } from 'zod'
import { EXPOSURE_AMOUNTS, FOOD_CONSUMERS } from '@/constants/exposure'

const AMOUNTS: readonly string[] = EXPOSURE_AMOUNTS.map((option) => option.value)
const CONSUMERS = FOOD_CONSUMERS.map((option) => option.value) as [string, ...string[]]

/**
 * README FINAL §5: "quem consumiu" e "o que foi" bastam para salvar. Marca,
 * ingredientes, quantidade, observação e data/hora ficam em "+ detalhes".
 */
export const exposureSchema = z.object({
  consumer: z.enum(CONSUMERS),
  food: z
    .string()
    .trim()
    .min(1, 'Informe o que foi consumido.')
    .max(200, 'Use no máximo 200 caracteres.'),
  amount: z
    .string()
    .refine((value) => value === '' || AMOUNTS.includes(value), 'Quantidade inválida.')
    .optional(),
  brand: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
  details: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
  occurredAt: z
    .string()
    .min(1, 'Informe a data e a hora.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Data ou hora inválida.'),
  note: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
})

export type ExposureValues = z.infer<typeof exposureSchema>
