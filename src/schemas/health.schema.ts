import { z } from 'zod'
import { HEALTH_KINDS, validateWeightKg } from '@/constants/health'
import { isNotInFuture } from '@/utils/dates'

const KINDS = HEALTH_KINDS.map((option) => option.value) as [string, ...string[]]

/**
 * README FINAL §12–16: os quatro registros de Saúde compartilham data/hora e
 * observação; nome/especialidade (até 120 caracteres) ou peso (0,3 a 60 kg)
 * são obrigatórios conforme o tipo. Consultas aceitam data futura (para
 * anotar dúvidas da próxima consulta); os demais exigem data até o momento atual.
 */
export const healthSchema = z
  .object({
    kind: z.enum(KINDS),
    medMode: z.enum(['treatment', 'single']).optional(),
    title: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
    dose: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
    intervalChoice: z.string().trim().optional(),
    customHours: z.string().trim().optional(),
    durationMode: z.enum(['days', 'continuous']).optional(),
    durationDays: z.string().trim().optional(),
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
    if (values.kind !== 'appointment' && !isNotInFuture(values.occurredAt)) {
      ctx.addIssue({
        code: 'custom',
        path: ['occurredAt'],
        message: 'A data não pode estar no futuro.',
      })
    }

    if (values.kind === 'weight') {
      const weightError = validateWeightKg(values.kg ?? '')
      if (weightError) {
        ctx.addIssue({
          code: 'custom',
          path: ['kg'],
          message: weightError,
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

    if (values.kind === 'medication' && values.medMode === 'treatment') {
      if (!values.dose) {
        ctx.addIssue({
          code: 'custom',
          path: ['dose'],
          message: 'Informe a dose prescrita.',
        })
      }

      const hours =
        values.intervalChoice === 'custom'
          ? Number((values.customHours ?? '').replace(',', '.'))
          : Number(values.intervalChoice ?? '8')
      if (!hours || Number.isNaN(hours) || hours <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['customHours'],
          message: 'Informe o intervalo entre as doses em horas.',
        })
      }

      if ((values.durationMode ?? 'days') === 'days') {
        const days = Number(values.durationDays ?? '')
        if (!days || Number.isNaN(days) || days < 1) {
          ctx.addIssue({
            code: 'custom',
            path: ['durationDays'],
            message: 'Informe por quantos dias o tratamento foi prescrito.',
          })
        }
      }
    }
  })

export type HealthValues = z.infer<typeof healthSchema>
