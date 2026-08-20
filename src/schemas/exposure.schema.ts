import { z } from 'zod'
import { EXPOSURE_AMOUNTS } from '@/constants/exposure'

const AMOUNTS: readonly string[] = EXPOSURE_AMOUNTS.map((option) => option.value)

/**
 * Só `alimento` e `data/hora` são obrigatórios — quantidade é toque e
 * observação é sempre opcional (05-roadmap.md).
 */
export const exposureSchema = z.object({
  food: z
    .string()
    .trim()
    .min(1, 'Informe o que foi consumido.')
    .max(200, 'Use no máximo 200 caracteres.'),
  amount: z
    .string()
    .refine((value) => value === '' || AMOUNTS.includes(value), 'Quantidade inválida.')
    .optional(),
  occurredAt: z
    .string()
    .min(1, 'Informe a data e a hora.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Data ou hora inválida.'),
  note: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
})

export type ExposureValues = z.infer<typeof exposureSchema>
