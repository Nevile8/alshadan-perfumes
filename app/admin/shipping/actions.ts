'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'

const MAX_SHIPPING_PRICE = 1_000_000

// ─── Surcharge ────────────────────────────────────────────────────────────────

export async function updateSurchargePercent(
  percent: number
): Promise<{ error: string | null }> {
  await requireAdmin()
  if (typeof percent !== 'number' || !Number.isFinite(percent) || percent < 0 || percent > 100) return { error: 'El porcentaje debe estar entre 0 y 100.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase
    .from('store_settings')
    .upsert({ key: 'extra_item_surcharge_percent', value: percent })
  if (error) return { error: error.message }
  revalidatePath('/admin/shipping')
  return { error: null }
}

// ─── Communes ─────────────────────────────────────────────────────────────────

export async function updateCommunePrice(
  id: string,
  basePrice: number
): Promise<{ error: string | null }> {
  await requireAdmin()
  if (typeof id !== 'string' || id.length > 40) return { error: 'Comuna no válida.' }
  if (!Number.isInteger(basePrice) || basePrice < 0 || basePrice > MAX_SHIPPING_PRICE) return { error: 'El precio debe ser un número entero, 0 o mayor.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase
    .from('communes')
    .update({ base_price: basePrice })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/shipping')
  return { error: null }
}

/** Sets the same base price for every commune in a region. */
export async function updateRegionPrice(
  regionCode: string,
  basePrice: number
): Promise<{ error: string | null; updated: number }> {
  await requireAdmin()
  if (typeof regionCode !== 'string' || regionCode.length > 10) return { error: 'Región no válida.', updated: 0 }
  if (!Number.isInteger(basePrice) || basePrice < 0 || basePrice > MAX_SHIPPING_PRICE) return { error: 'El precio debe ser un número entero, 0 o mayor.', updated: 0 }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from('communes')
    .update({ base_price: basePrice })
    .eq('region_code', regionCode)
    .select('id')
  if (error) return { error: error.message, updated: 0 }
  revalidatePath('/admin/shipping')
  return { error: null, updated: (data ?? []).length }
}

export async function toggleCommuneActive(
  id: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  await requireAdmin()
  if (typeof id !== 'string' || id.length > 40 || typeof isActive !== 'boolean') return { error: 'Datos inválidos.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase
    .from('communes')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/shipping')
  return { error: null }
}