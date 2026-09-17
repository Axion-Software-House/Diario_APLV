/**
 * Lugares — README FINAL §11. Texto livre no banco
 * (environment_records.place); evolui sem migration.
 */
export const ENVIRONMENT_PLACES = [
  { value: 'familiares', label: 'Casa de familiares ou amigos' },
  { value: 'creche', label: 'Escola / Creche' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'festa', label: 'Festa / Evento' },
  { value: 'viagem', label: 'Viagem / Passeio' },
  { value: 'outro', label: 'Outro' },
] as const

export type EnvironmentPlace = (typeof ENVIRONMENT_PLACES)[number]['value']

export const ENVIRONMENT_PLACE_LABELS = new Map<string, string>(
  ENVIRONMENT_PLACES.map((option) => [option.value, option.label]),
)
