import { z } from 'zod'
import { ENVIRONMENT_PLACES } from '@/constants/environments'

const PLACES = ENVIRONMENT_PLACES.map((option) => option.value) as [string, ...string[]]

/** README FINAL §11: só o lugar é obrigatório. */
export const environmentSchema = z.object({
  place: z.enum(PLACES, { message: 'Escolha onde vocês estiveram.' }),
  different: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
  occurredAt: z
    .string()
    .min(1, 'Informe a data e a hora.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Data ou hora inválida.'),
  note: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
})

export type EnvironmentValues = z.infer<typeof environmentSchema>
