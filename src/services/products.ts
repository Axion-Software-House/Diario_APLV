import { supabase } from '@/services/supabase'
import { toAppError } from '@/lib/errors'
import type { ProductRecord } from '@/types'

export type ProductInput = {
  userId: string
  childId: string
  /** Só preenchidos durante um TPO ativo. */
  protocolId: string | null
  stage: number | null
  occurredAt: string
  category: string
  isNew: boolean | null
  name: string | null
  brand: string | null
  note: string | null
}

export async function createProductRecord(input: ProductInput): Promise<ProductRecord> {
  const { data, error } = await supabase
    .from('product_records')
    .insert({
      user_id: input.userId,
      child_id: input.childId,
      protocol_id: input.protocolId,
      stage: input.stage,
      occurred_at: input.occurredAt,
      category: input.category,
      is_new: input.isNew,
      name: input.name,
      brand: input.brand,
      note: input.note,
    })
    .select()
    .single()

  if (error) throw toAppError(error)
  return data
}

export type ProductPatch = {
  category: string
  isNew: boolean | null
  name: string | null
  brand: string | null
  occurredAt: string
  note: string | null
}

export async function updateProductRecord(id: string, patch: ProductPatch): Promise<ProductRecord> {
  const { data, error } = await supabase
    .from('product_records')
    .update({
      category: patch.category,
      is_new: patch.isNew,
      name: patch.name,
      brand: patch.brand,
      occurred_at: patch.occurredAt,
      note: patch.note,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw toAppError(error)
  return data
}

export async function deleteProductRecord(id: string): Promise<void> {
  const { error } = await supabase.from('product_records').delete().eq('id', id)
  if (error) throw toAppError(error)
}

/** Produtos registrados da criança, mais recentes primeiro. */
export async function listProductRecords(childId: string): Promise<ProductRecord[]> {
  const { data, error } = await supabase
    .from('product_records')
    .select('*')
    .eq('child_id', childId)
    .order('occurred_at', { ascending: false })

  if (error) throw toAppError(error)
  return data ?? []
}
