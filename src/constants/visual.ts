import { EMOJI } from '@/constants/emojis'
import type { EmojiKey } from '@/constants/emojis'

/**
 * Tom claro de cada área — o fundo do círculo onde o emoji fica (atalhos da
 * Home, "+ Novo registro", hub de Saúde, resumos, barra lateral). Os valores
 * vivem em `tokens.css` (`--tone-*`); aqui só o mapa, para a mesma área ter
 * sempre a mesma cor, em qualquer tela.
 *
 * As subáreas da Saúde (medicamento, vacina, consulta, peso) herdam o tom da
 * Saúde: são a mesma área, só com emojis diferentes.
 *
 * É fundo, não texto: o que vai em cima é emoji (decorativo) ou
 * `--color-text`, que dá ≥ 12:1 com todos os tons.
 */
export const AREA_TONE: Readonly<Record<EmojiKey, string>> = {
  food: 'var(--tone-food)',
  symptom: 'var(--tone-symptom)',
  calm: 'var(--tone-calm)',
  diaper: 'var(--tone-diaper)',
  note: 'var(--tone-note)',
  diary: 'var(--tone-diary)',
  tpo: 'var(--tone-tpo)',
  report: 'var(--tone-report)',
  product: 'var(--tone-product)',
  environment: 'var(--tone-environment)',
  health: 'var(--tone-health)',
  medication: 'var(--tone-health)',
  vaccine: 'var(--tone-health)',
  appointment: 'var(--tone-health)',
  weight: 'var(--tone-health)',
  home: 'var(--tone-home)',
  learn: 'var(--tone-learn)',
}

const KEY_BY_EMOJI = new Map<string, EmojiKey>(
  (Object.entries(EMOJI) as [EmojiKey, string][]).map(([key, emoji]) => [emoji, key]),
)

/** A área de um emoji do mapa (`EMOJI.food` → `'food'`); `undefined` se não for do mapa. */
export function areaOfEmoji(emoji: string): EmojiKey | undefined {
  return KEY_BY_EMOJI.get(emoji)
}

/**
 * O tom de um emoji do mapa. Para componentes que recebem o emoji pronto
 * (`ActionTile`, `EmptyState`) e não a área. Emoji fora do mapa cai no lilás
 * da marca.
 */
export function toneOfEmoji(emoji: string): string {
  const key = areaOfEmoji(emoji)
  return key ? AREA_TONE[key] : 'var(--color-primary-soft)'
}
