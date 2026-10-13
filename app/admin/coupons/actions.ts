'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import type { DiscountType } from '@/lib/types/database'

export type CouponFormState = { error: string | null; success?: boolean } | null

const CODE_RE = /^[A-Z0-9_-]{3,30}$/

/** "2026-12-31" → end of that day in Chile, as an ISO timestamp. */
function endOfDayInChile(date: string): string {
  const probe  = new Date(`${date}T12:00:00Z`)
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santiago', timeZoneName: 'longOffset' })
    .formatToParts(probe)
    .find((p) => p.type === 'timeZoneName')?.value.replace('GMT', '') || '-03:00'
  return new Date(`${date}T23:59:59${offset}`).toISOString()
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

type ParsedCoupon = {
  code:           string
  discount_type:  DiscountType
  discount_value: number
  min_purchase:   number | null
  max_uses:       number | null
  expires_at:     string | null
}

function parseCoupon(formData: FormData): { data: ParsedCoupon | null; error: string | null } {
  const code  = formData.get('code')?.toString().trim().toUpperCase() ?? ''
  const type  = formData.get('discount_type')?.toString()
  const value = Number(formData.get('discount_value'))
  const minRaw     = formData.get('min_purchase')?.toString().trim() ?? ''
  const maxUsesRaw = formData.get('max_uses')?.toString().trim() ?? ''
  const expiresRaw = formData.get('expires_at')?.toString().trim() ?? ''

  if (!CODE_RE.test(code)) {
    return { data: null, error: 'El código debe tener entre 3 y 30 caracteres: letras, números, guion o guion bajo.' }
  }
  if (type !== 'percentage' && type !== 'fixed') return { data: null, error: 'Elige el tipo de descuento.' }
  if (!Number.isFinite(value) || value <= 0) return { data: null, error: 'El descuento debe ser mayor a 0.' }
  if (type === 'percentage' && value > 100) return { data: null, error: 'El porcentaje no puede ser mayor a 100.' }
  if (type === 'fixed' && !Number.isInteger(value)) return { data: null, error: 'El monto fijo debe ser un número entero de pesos.' }

  const min = minRaw === '' ? null : Number(minRaw)
  if (min !== null && (!Number.isFinite(min) || min < 0)) return { data: null, error: 'La compra mínima no es válida.' }

  const maxUses = maxUsesRaw === '' ? null : Number(maxUsesRaw)
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
    return { data: null, error: 'El máximo de usos debe ser un número entero mayor a 0, o vacío para ilimitado.' }
  }

  if (expiresRaw && !/^\d{4}-\d{2}-\d{2}$/.test(expiresRaw)) return { data: null, error: 'La fecha de vencimiento no es válida.' }

  return {
    data: {
      code,
      discount_type:  type,
      discount_value: value,
      min_purchase:   min,
      max_uses:       maxUses,
      expires_at:     expiresRaw ? endOfDayInChile(expiresRaw) : null,
    },
    error: null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function codeTaken(supabase: any, code: string, exceptId?: string): Promise<boolean> {
  let query = supabase.from('coupons').select('id').ilike('code', escapeLike(code))
  if (exceptId) query = query.neq('id', exceptId)
  const { data } = await query
  return (data ?? []).length > 0
}

export async function createCoupon(_prev: CouponFormState, formData: FormData): Promise<CouponFormState> {
  await requireAdmin()
  const { data, error } = parseCoupon(formData)
  if (!data) return { error }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  if (await codeTaken(supabase, data.code)) return { error: `Ya existe un cupón con el código ${data.code}.` }

  const { error: insertError } = await supabase.from('coupons').insert({ ...data, is_active: true })
  if (insertError) return { error: insertError.message }

  revalidatePath('/admin/coupons')
  redirect('/admin/coupons')
}

export async function updateCoupon(id: string, _prev: CouponFormState, formData: FormData): Promise<CouponFormState> {
  await requireAdmin()
  const { data, error } = parseCoupon(formData)
  if (!data) return { error }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data: current } = await supabase.from('coupons').select('code, current_uses').eq('id', id).maybeSingle()
  if (!current) return { error: 'El cupón ya no existe.' }

  // Usage history is linked by code, so a used coupon keeps its code
  if (current.current_uses > 0 && current.code.toUpperCase() !== data.code) {
    return { error: 'Este cupón ya fue usado, así que su código no se puede cambiar. Crea un cupón nuevo.' }
  }
  if (await codeTaken(supabase, data.code, id)) return { error: `Ya existe un cupón con el código ${data.code}.` }

  const { error: updateError } = await supabase.from('coupons').update(data).eq('id', id)
  if (updateError) return { error: updateError.message }

  revalidatePath('/admin/coupons')
  revalidatePath(`/admin/coupons/${id}`)
  return { error: null, success: true }
}

export async function setCouponActive(id: string, isActive: boolean): Promise<{ error: string | null }> {
  await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase.from('coupons').update({ is_active: isActive }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/coupons')
  revalidatePath(`/admin/coupons/${id}`)
  return { error: null }
}
