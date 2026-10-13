import { formatPrice } from '@/lib/utils'
import type { Coupon, OrderStatus } from '@/lib/types/database'

/** Orders whose payment went through, i.e. the ones that count as a coupon use. */
export const PAID_STATUSES: OrderStatus[] = ['paid', 'shipped', 'delivered']

export function describeDiscount(coupon: Pick<Coupon, 'discount_type' | 'discount_value'>): string {
  return coupon.discount_type === 'percentage'
    ? `${Number(coupon.discount_value)}%`
    : formatPrice(Number(coupon.discount_value))
}

export type CouponState = 'active' | 'inactive' | 'expired' | 'exhausted'

export function couponState(coupon: Coupon, now = new Date()): CouponState {
  if (!coupon.is_active) return 'inactive'
  if (coupon.expires_at && new Date(coupon.expires_at) < now) return 'expired'
  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) return 'exhausted'
  return 'active'
}

export const COUPON_STATE_LABEL: Record<CouponState, string> = {
  active:    'Activo',
  inactive:  'Desactivado',
  expired:   'Vencido',
  exhausted: 'Agotado',
}

export const COUPON_STATE_STYLE: Record<CouponState, string> = {
  active:    'bg-green-950/50 text-green-400 border-green-900/50',
  inactive:  'bg-neutral-800 text-neutral-400 border-neutral-700',
  expired:   'bg-red-950/50 text-red-400 border-red-900/50',
  exhausted: 'bg-yellow-950/50 text-yellow-400 border-yellow-900/50',
}

export function formatChileDate(iso: string, withTime = false): string {
  return new Date(iso).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

/** ISO timestamp → "YYYY-MM-DD" in Chile, for <input type="date">. */
export function toChileDateInput(iso: string | null): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date(iso))
}
