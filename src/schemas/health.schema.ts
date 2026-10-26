import { z } from 'zod'
import { HEALTH_KINDS } from '@/constants/health'

const KINDS = HEALTH_KINDS.map((option) => option.value) as [string, ...string[]]

/**
 * README FINAL §12–16: os quatro registros de Saúde compartilham data/hora e
 * observação; nome/especialidade (até 120 caracteres) ou peso (> 0) são
 * obrigatórios conforme o tipo.
 */
export const healthSchema = z
  .object({
    kind: z.enum(KINDS),
    title: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
    dose: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
    reaction: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
    guidance: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
    questions: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
    kg: z.string().trim().optional(),
    occurredAt: z
      .string()
      .min(1, 'Informe a data e a hora.')
      .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Data ou hora inválida.'),
    note: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
  })
  .superRefine((values, ctx) => {
    if (values.kind === 'weight') {
      const parsed = Number((values.kg ?? '').replace(',', '.'))
      if (!values.kg || Number.isNaN(parsed) || parsed <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['kg'],
          message: 'Informe o peso.',
        })
      }
      return
    }

    if (!values.title) {
      ctx.addIssue({
        code: 'custom',
        path: ['title'],
        message: values.kind === 'appointment' ? 'Informe a especialidade.' : 'Informe o nome.',
      })
    }
  })

export type HealthValues = z.infer<typeof healthSchema>
