import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Data/hora atual em ISO — base do preenchimento automático de `occurred_at`. */
export function nowISO(): string {
  return new Date().toISOString()
}

/** Ex.: "20/08/2026 às 14:32" */
export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}
