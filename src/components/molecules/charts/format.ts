/** Singular e plural da unidade contada (ex.: fralda / fraldas). */
export type CountUnit = { one: string; many: string }

export const RECORD_UNIT: CountUnit = { one: 'registro', many: 'registros' }

/** "0 registros", "1 registro", "3 registros". */
export function countLabel(value: number, unit: CountUnit = RECORD_UNIT): string {
  return value === 1 ? `1 ${unit.one}` : `${value} ${unit.many}`
}
