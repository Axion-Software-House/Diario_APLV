/**
 * Catálogo de sintomas — README FINAL §6.
 *
 * `code` é o valor gravado em symptom_event_items.code.
 * Adicionar sintoma = adicionar linha aqui (não precisa de migration).
 * NUNCA remover um code já usado em produção: os registros antigos o referenciam.
 *
 * O fluxo é progressivo: primeiro a família escolhe UMA categoria
 * ("o que você percebeu?"), depois marca os sintomas dela pela intensidade.
 *
 * `alarm: true` faz a UI exibir orientação para procurar o profissional de
 * saúde. É orientação de cuidado — não é diagnóstico, gravidade nem conduta.
 */
export const SYMPTOM_GROUPS = [
  { id: 'fezes', label: 'Fezes' },
  { id: 'barriguinha', label: 'Barriguinha' },
  { id: 'pele', label: 'Pele' },
  { id: 'respiracao', label: 'Respiração' },
  { id: 'comportamento', label: 'Comportamento / estado geral' },
  { id: 'outro', label: 'Outro' },
] as const

export type SymptomGroupId = (typeof SYMPTOM_GROUPS)[number]['id']

export type Symptom = {
  code: string
  label: string
  group: SymptomGroupId
  alarm?: true
}

export const SYMPTOMS: readonly Symptom[] = [
  // Fezes
  { code: 'mucus_stool', label: 'Muco nas fezes', group: 'fezes' },
  { code: 'blood_stool', label: 'Sangue nas fezes', group: 'fezes', alarm: true },
  { code: 'diarrhea', label: 'Diarreia', group: 'fezes' },
  { code: 'more_stools', label: 'Mais evacuações que o habitual', group: 'fezes' },
  { code: 'constipation', label: 'Constipação', group: 'fezes' },

  // Barriguinha
  { code: 'regurgitation', label: 'Regurgitação', group: 'barriguinha' },
  { code: 'vomit', label: 'Vômito', group: 'barriguinha' },
  { code: 'abdominal_distension', label: 'Distensão abdominal', group: 'barriguinha' },
  { code: 'discomfort', label: 'Desconforto aparente', group: 'barriguinha' },
  { code: 'feed_refusal', label: 'Recusa da mamada ou alimentação', group: 'barriguinha' },

  // Pele
  { code: 'eczema', label: 'Dermatite / eczema', group: 'pele' },
  { code: 'redness', label: 'Vermelhidão', group: 'pele' },
  { code: 'urticaria', label: 'Urticária', group: 'pele', alarm: true },
  { code: 'swelling', label: 'Inchaço', group: 'pele', alarm: true },

  // Respiração
  { code: 'cough_wheeze', label: 'Tosse / chiado', group: 'respiracao' },
  {
    code: 'breathing_difficulty',
    label: 'Dificuldade para respirar',
    group: 'respiracao',
    alarm: true,
  },

  // Comportamento / estado geral
  { code: 'irritability', label: 'Irritabilidade diferente do habitual', group: 'comportamento' },
  { code: 'intense_crying', label: 'Choro intenso', group: 'comportamento' },
  { code: 'pallor', label: 'Palidez importante', group: 'comportamento', alarm: true },
  { code: 'drowsiness', label: 'Sonolência / prostração', group: 'comportamento', alarm: true },

  // Outro
  { code: 'other', label: 'Outro', group: 'outro' },
] as const

/** 1 Leve · 2 Moderada · 3 Intensa — o toque na intensidade seleciona o sintoma. */
export const INTENSITIES = [
  { value: 1, label: 'Leve' },
  { value: 2, label: 'Moderada' },
  { value: 3, label: 'Intensa' },
] as const

export type Intensity = (typeof INTENSITIES)[number]['value']

/** Mensagem fixa da tela de sintomas (05-roadmap.md, README FINAL §2). */
export const SYMPTOM_SCREEN_MESSAGE =
  'Registre apenas o que realmente observar. Não é necessário procurar sintomas.'

export const ALARM_MESSAGE =
  'Procure o profissional de saúde responsável para avaliar este sinal.'
