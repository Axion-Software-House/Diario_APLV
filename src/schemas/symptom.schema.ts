import { z } from 'zod'

const intensity = z.union([z.literal(1), z.literal(2), z.literal(3)])

const occurredAt = z
  .string()
  .min(1, 'Informe a data e a hora.')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Data ou hora inválida.')

const note = z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional()

/**
 * `items` é código do sintoma → intensidade. O toque na intensidade é o que
 * inclui o sintoma, então não existe estado "marcado sem intensidade".
 */
export const symptomEventSchema = z.object({
  items: z
    .record(z.string(), intensity)
    .refine((value) => Object.keys(value).length > 0, 'Marque ao menos um sintoma.'),
  /** Texto livre do sintoma "Outro" — guardado na observação do evento. */
  otherText: z.string().trim().max(200, 'Use no máximo 200 caracteres.').optional(),
  occurredAt,
  exposureId: z.string().optional(),
  note,
})

export type SymptomEventValues = z.infer<typeof symptomEventSchema>

/** "Sem sintomas" não tem itens nem vínculo — só quando e, se a família quiser, uma nota. */
export const noSymptomsSchema = z.object({ occurredAt, note })

export type NoSymptomsValues = z.infer<typeof noSymptomsSchema>
