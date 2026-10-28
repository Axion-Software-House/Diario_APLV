/**
 * Mapa único de emojis do app — docs/10-design-telas.md, "Emojis e rostinhos".
 * Atalhos da Home, "+ Novo registro", barra inferior, filtros e marcadores do
 * Diário, hub de Saúde e aba TPO leem daqui, para a mesma área nunca aparecer
 * com dois emojis diferentes.
 *
 * Origem de cada um:
 * - README antigo, mantidos pelo doc: alimentação, sintoma, tudo tranquilo,
 *   fralda, observação, diário, TPO, relatório (e os rostinhos da intensidade,
 *   em `INTENSITIES` de constants/symptoms.ts);
 * - sugestão do doc, ainda a aprovar com o cliente: produto, ambiente, saúde,
 *   medicamento, vacina, consulta, peso, início e aprender.
 *
 * Regras de uso: sempre emoji + texto, nunca sozinho; o elemento do emoji
 * leva `aria-hidden="true"` e `data-emoji` (o `@media print` de global.css
 * esconde todo `[data-emoji]`, para o Relatório impresso sair sem emoji).
 */
export const EMOJI = {
  food: '🍽️',
  symptom: '🤒',
  calm: '😊',
  diaper: '🩲',
  note: '📝',
  diary: '🕒',
  tpo: '🪜',
  report: '📄',
  product: '🧴',
  environment: '📍',
  health: '❤️‍🩹',
  medication: '💊',
  vaccine: '💉',
  appointment: '🩺',
  weight: '⚖️',
  home: '🏠',
  learn: '📚',
} as const

export type EmojiKey = keyof typeof EMOJI
