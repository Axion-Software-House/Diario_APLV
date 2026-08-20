import { z } from 'zod'
import { DIAPER_BLOOD, DIAPER_CONSISTENCY, DIAPER_MUCUS } from '@/constants/diaper'

const values = (options: readonly { value: string }[]): readonly string[] =>
  options.map((option) => option.value)

const oneOf = (options: readonly { value: string }[], message: string) =>
  z.string().refine((value) => values(options).includes(value), message)

/**
 * Nenhum campo obrigatório de digitação: os três seletores já vêm com um
 * valor e a observação é livre. Registrar uma fralda é só tocar e salvar.
 */
export const diaperSchema = z.object({
  blood: oneOf(DIAPER_BLOOD, 'Opção inválida.'),
  mucus: oneOf(DIAPER_MUCUS, 'Opção inválida.'),
  consistency: z
    .string()
    .refine(
      (value) => value === '' || values(DIAPER_CONSISTENCY).includes(value),
      'Opção inválida.',
    )
    .optional(),
  occurredAt: z
    .string()
    .min(1, 'Informe a data e a hora.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Data ou hora inválida.'),
  note: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
})

export type DiaperValues = z.infer<typeof diaperSchema>
