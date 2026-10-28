import { z } from 'zod'
import {
  EXPOSURE_AMOUNTS,
  EXPOSURE_DAIRY_OPTIONS,
  EXPOSURE_TPO_OPTIONS,
  FOOD_CONSUMERS,
} from '@/constants/exposure'
import { isNotInFuture } from '@/utils/dates'

const AMOUNTS: readonly string[] = EXPOSURE_AMOUNTS.map((option) => option.value)
const CONSUMERS = FOOD_CONSUMERS.map((option) => option.value) as [string, ...string[]]
const DAIRY_VALUES: readonly string[] = EXPOSURE_DAIRY_OPTIONS.map((option) => option.value)
const TPO_VALUES: readonly string[] = EXPOSURE_TPO_OPTIONS.map((option) => option.value)

/**
 * README FINAL §5: "quem consumiu", "o que foi" e "continha leite ou derivados?"
 * na primeira tela. Quando há TPO ativo, pergunta também "É o alimento do TPO?"
 * para não misturar a alimentação de rotina com o alimento testado na etapa.
 *
 * Com TPO ativo a resposta é obrigatória e nunca vem presumida: um "Não" de
 * fábrica deixava o alimento do teste sem etapa quando a família salvava sem
 * mexer na pergunta, e a contagem da etapa ficava em zero.
 */
export function exposureSchemaFor(hasActiveTpo: boolean) {
  return z.object({
    consumer: z.enum(CONSUMERS),
    food: z
      .string()
      .trim()
      .min(1, 'Informe o que foi consumido.')
      .max(200, 'Use no máximo 200 caracteres.'),
    // Sem TPO ativo a pergunta não aparece e o valor fica ''.
    isTpoFood: z
      .string({ error: 'Informe se é o alimento do TPO.' })
      .refine(
        (value) => (value ? TPO_VALUES.includes(value) : !hasActiveTpo),
        'Informe se é o alimento do TPO.',
      ),
    containsDairy: z
      .string()
      .refine(
        (value) => value === '' || DAIRY_VALUES.includes(value),
        'Informe se continha leite ou derivados.',
      )
      .optional(),
    amount: z
      .string()
      .refine((value) => value === '' || AMOUNTS.includes(value), 'Quantidade inválida.')
      .optional(),
    brand: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
    details: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
    occurredAt: z
      .string()
      .min(1, 'Informe a data e a hora.')
      .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Data ou hora inválida.')
      .refine((value) => isNotInFuture(value), 'A data não pode estar no futuro.'),
    note: z.string().trim().max(2000, 'Use no máximo 2000 caracteres.').optional(),
  })
}

export type ExposureValues = z.infer<ReturnType<typeof exposureSchemaFor>>
