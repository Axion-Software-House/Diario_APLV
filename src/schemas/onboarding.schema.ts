import { z } from 'zod'
import { isNotInFuture, parseDate } from '@/utils/dates'

function isValidDate(value: string): boolean {
  return !Number.isNaN(parseDate(value).getTime())
}

/**
 * O onboarding cria só a criança (docs/08). Um TPO, se houver, é iniciado
 * depois na aba TPO. Digitação é exceção: só nome e motivo são texto livre.
 */
export const onboardingSchema = z.object({
  childName: z
    .string()
    .trim()
    .min(1, 'Informe o nome ou apelido da criança.')
    .max(80, 'Use no máximo 80 caracteres.'),
  birthDate: z
    .string()
    // Duas regras com duas mensagens: uma data que não existe não está "no futuro".
    .refine((value) => !value || isValidDate(value), 'Informe uma data de nascimento válida.')
    .refine(
      (value) => !value || !isValidDate(value) || isNotInFuture(value),
      'A data de nascimento não pode estar no futuro.',
    )
    .optional(),
  feeding: z.string().optional(),
  reason: z.string().trim().max(500, 'Use no máximo 500 caracteres.').optional(),
  professional: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
})

export type OnboardingValues = z.infer<typeof onboardingSchema>
