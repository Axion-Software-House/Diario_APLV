import { z } from 'zod'
import { isNotInFuture } from '@/utils/dates'

/** O único registro do diário em que o texto é o conteúdo, não um complemento. */
export const noteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Escreva a observação.')
    .max(2000, 'Use no máximo 2000 caracteres.'),
  occurredAt: z
    .string()
    .min(1, 'Informe a data e a hora.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Data ou hora inválida.')
    .refine((value) => isNotInFuture(value), 'A data não pode estar no futuro.'),
})

export type NoteValues = z.infer<typeof noteSchema>
