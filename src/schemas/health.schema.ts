import { z } from 'zod'
import { HEALTH_KINDS, validateMeasuresInput } from '@/constants/health'
import { formatDateTime, isNotInFuture, parseDate, toDateTimeLocalValue } from '@/utils/dates'

const KINDS = HEALTH_KINDS.map((option) => option.value) as [string, ...string[]]

/**
 * Limites de digitação do tratamento. Não são posologia: só barram erro de
 * digitação ("800" horas, "5000" dias). O que vale é o que está na receita.
 */
export const MAX_INTERVAL_HOURS = 72
export const MAX_DURATION_DAYS = 365

/** Número digitado no celular, aceitando vírgula decimal ("1,5"). */
export function parseDecimalInput(raw: string | undefined): number {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return Number.NaN
  return Number(trimmed.replace(',', '.'))
}

/**
 * Valida a data de encerramento de um tratamento (valor de
 * `datetime-local`). Não pode estar no futuro (com a tolerância de 5 min de
 * `isNotInFuture`) nem antes do início do tratamento. O início é comparado
 * no minuto, porque o campo não tem segundos: encerrar no mesmo minuto em
 * que o tratamento começou é aceito.
 */
export function validateTreatmentEnd(
  endAt: string,
  startedAt: string,
  now: Date = new Date(),
): string | null {
  if (!endAt || Number.isNaN(parseDate(endAt).getTime())) {
    return 'Informe a data e a hora do encerramento.'
  }
  if (!isNotInFuture(endAt, now)) return 'A data não pode estar no futuro.'
  const startMinute = parseDate(toDateTimeLocalValue(startedAt)).getTime()
  if (parseDate(endAt).getTime() < startMinute) {
    return `O encerramento não pode ser antes do início do tratamento (${formatDateTime(startedAt)}).`
  }
  return null
}

/**
 * README FINAL §12–16: os quatro registros de Saúde compartilham data/hora e
 * observação; nome/especialidade (até 120 caracteres) ou pelo menos uma
 * medida (peso de 0,3 a 60 kg, comprimento de 25 a 180 cm, perímetro
 * cefálico de 20 a 65 cm) são obrigatórios conforme o tipo. Consultas aceitam data futura (para
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
    lengthCm: z.string().trim().optional(),
    headCm: z.string().trim().optional(),
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
      const { fields, required } = validateMeasuresInput(values)
      for (const [key, message] of Object.entries(fields)) {
        ctx.addIssue({ code: 'custom', path: [key], message })
      }
      // Os três vazios: o aviso vai no primeiro campo, o do peso.
      if (required) ctx.addIssue({ code: 'custom', path: ['kg'], message: required })
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

      if (!values.intervalChoice) {
        ctx.addIssue({
          code: 'custom',
          path: ['intervalChoice'],
          message: 'Informe o intervalo entre as doses.',
        })
      } else if (values.intervalChoice === 'custom') {
        const hours = parseDecimalInput(values.customHours)
        if (!Number.isFinite(hours) || hours <= 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['customHours'],
            message: 'Informe o intervalo entre as doses em horas.',
          })
        } else if (hours > MAX_INTERVAL_HOURS) {
          ctx.addIssue({
            code: 'custom',
            path: ['customHours'],
            message: `Use no máximo ${MAX_INTERVAL_HOURS} horas.`,
          })
        }
      }

      if ((values.durationMode ?? 'days') === 'days') {
        const days = parseDecimalInput(values.durationDays)
        if (!Number.isFinite(days) || days <= 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['durationDays'],
            message: 'Informe por quantos dias o tratamento foi prescrito.',
          })
        } else if (!Number.isInteger(days)) {
          ctx.addIssue({
            code: 'custom',
            path: ['durationDays'],
            message: 'Informe um número inteiro de dias.',
          })
        } else if (days > MAX_DURATION_DAYS) {
          ctx.addIssue({
            code: 'custom',
            path: ['durationDays'],
            message: `Use no máximo ${MAX_DURATION_DAYS} dias.`,
          })
        }
      }
    }
  })

export type HealthValues = z.infer<typeof healthSchema>
