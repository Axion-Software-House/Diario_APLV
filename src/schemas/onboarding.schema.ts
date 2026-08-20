import { z } from 'zod'

/** Digitação é exceção: só nome e motivo são texto livre. */
export const onboardingSchema = z.object({
  childName: z
    .string()
    .trim()
    .min(1, 'Informe o nome ou apelido da criança.')
    .max(80, 'Use no máximo 80 caracteres.'),
  birthDate: z.string().optional(),
  feeding: z.string().optional(),
  reason: z.string().trim().max(500, 'Use no máximo 500 caracteres.').optional(),
  professional: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
  startedAt: z.string().min(1, 'Informe a data de início.'),
})

export type OnboardingValues = z.infer<typeof onboardingSchema>
