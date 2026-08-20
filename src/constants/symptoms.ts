/**
 * Catálogo de sintomas — 05-roadmap.md (M6).
 *
 * `code` é o valor gravado em symptom_event_items.code.
 * Adicionar sintoma = adicionar linha aqui (não precisa de migration).
 * NUNCA remover um code já usado em produção: os registros antigos o referenciam.
 *
 * `alarm: true` faz a UI exibir orientação para procurar o profissional de saúde.
 * É orientação de cuidado — não é diagnóstico, gravidade nem conduta.
 */
export const SYMPTOM_GROUPS = [
  { id: 'gastro', label: 'Gastrointestinais / Fezes' },
  { id: 'pele', label: 'Pele' },
  { id: 'geral', label: 'Respiratórios / Estado geral' },
  { id: 'outros', label: 'Outros' },
] as const

export type SymptomGroupId = (typeof SYMPTOM_GROUPS)[number]['id']

export type Symptom = {
  code: string
  label: string
  group: SymptomGroupId
  alarm?: true
}

export const SYMPTOMS: readonly Symptom[] = [
  // Gastrointestinais / Fezes
  { code: 'mucus_stool', label: 'Muco nas fezes', group: 'gastro' },
  { code: 'blood_stool', label: 'Sangue nas fezes', group: 'gastro', alarm: true },
  { code: 'diarrhea', label: 'Diarreia', group: 'gastro' },
  { code: 'more_stools', label: 'Mais evacuações que o habitual', group: 'gastro' },
  { code: 'constipation', label: 'Constipação', group: 'gastro' },
  { code: 'regurgitation', label: 'Regurgitação', group: 'gastro' },
  { code: 'vomit', label: 'Vômito', group: 'gastro' },
  { code: 'abdominal_distension', label: 'Distensão abdominal', group: 'gastro' },
  { code: 'discomfort', label: 'Desconforto aparente', group: 'gastro' },
  { code: 'feed_refusal', label: 'Recusa da mamada', group: 'gastro' },

  // Pele
  { code: 'eczema', label: 'Dermatite / eczema', group: 'pele' },
  { code: 'redness', label: 'Vermelhidão', group: 'pele' },
  { code: 'urticaria', label: 'Urticária', group: 'pele', alarm: true },
  { code: 'swelling', label: 'Inchaço', group: 'pele', alarm: true },

  // Respiratórios / Estado geral
  { code: 'cough_wheeze', label: 'Tosse / chiado', group: 'geral' },
  { code: 'breathing_difficulty', label: 'Dificuldade para respirar', group: 'geral', alarm: true },
  { code: 'irritability', label: 'Irritabilidade diferente do habitual', group: 'geral' },
  { code: 'intense_crying', label: 'Choro intenso', group: 'geral' },
  { code: 'pallor', label: 'Palidez importante', group: 'geral', alarm: true },
  { code: 'drowsiness', label: 'Sonolência / prostração', group: 'geral', alarm: true },

  // Outros
  { code: 'other', label: 'Outro', group: 'outros' },
] as const

/** 1 Leve · 2 Moderada · 3 Intensa — o toque na intensidade seleciona o sintoma. */
export const INTENSITIES = [
  { value: 1, label: 'Leve' },
  { value: 2, label: 'Moderada' },
  { value: 3, label: 'Intensa' },
] as const

export type Intensity = (typeof INTENSITIES)[number]['value']

/** Mensagem fixa da tela de sintomas (05-roadmap.md). */
export const SYMPTOM_SCREEN_MESSAGE =
  'Registre apenas o que realmente observar. Não é necessário procurar sintomas.'

export const ALARM_MESSAGE =
  'Procure o profissional de saúde responsável para avaliar este sinal.'
