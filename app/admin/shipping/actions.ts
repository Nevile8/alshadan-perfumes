'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'

// ─── Surcharge ────────────────────────────────────────────────────────────────

export async function updateSurchargePercent(
  percent: number
): Promise<{ error: string | null }> {
  await requireAdmin()
  if (percent < 0 || percent > 100) return { error: 'El porcentaje debe estar entre 0 y 100.' }
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
  if (basePrice < 0) return { error: 'El precio no puede ser negativo.' }
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

export async function toggleCommuneActive(
  id: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  await requireAdmin()
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