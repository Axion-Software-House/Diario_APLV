import { z } from 'zod'
import { isNotInFuture } from '@/utils/dates'

const intensity = z.union([z.literal(1), z.literal(2), z.literal(3)])

const occurredAt = z
  .string()
  .min(1, 'Informe a data e a hora.')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Data ou hora inválida.')
  .refine((value) => isNotInFuture(value), 'A data não pode estar no futuro.')

const note = z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional()

/**
 * `items` é código do sintoma → intensidade. O toque na intensidade é o que
 * inclui o sintoma, então não existe estado "marcado sem intensidade".
 */
export const symptomEventSchema = z
  .object({
    items: z
      .record(z.string(), intensity)
      .refine((value) => Object.keys(value).length > 0, 'Marque ao menos um sintoma.'),
    /** Texto livre do sintoma "Outro" — guardado na observação do evento. */
    otherText: z.string().trim().max(200, 'Use no máximo 200 caracteres.').optional(),
    occurredAt,
    exposureId: z.string().optional(),
    environmentId: z.string().optional(),
    productId: z.string().optional(),
    note,
  })
  .superRefine((data, ctx) => {
    if (data.items.other && (!data.otherText || data.otherText.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Descreva o sintoma.',
        path: ['otherText'],
      })
    }
  })

export type SymptomEventValues = z.infer<typeof symptomEventSchema>

export const symptomEvolutionSchema = z.object({
  symptomEventId: z.string().min(1, 'Escolha o episódio de sintomas que deseja acompanhar.'),
  status: z.enum(['improved', 'unchanged', 'worsened'], {
    message: 'Informe como o sintoma evoluiu.',
  }),
  occurredAt,
  note,
})

export type SymptomEvolutionValues = z.infer<typeof symptomEvolutionSchema>

/** "Sem sintomas" não tem itens nem vínculo — só quando e, se a família quiser, uma nota. */
export const noSymptomsSchema = z.object({ occurredAt, note })

export type NoSymptomsValues = z.infer<typeof noSymptomsSchema>
