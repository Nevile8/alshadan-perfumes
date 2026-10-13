import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrice } from '@/lib/utils'
import { CouponActiveToggle } from '@/components/admin/CouponActiveToggle'
import {
  PAID_STATUSES, COUPON_STATE_LABEL, COUPON_STATE_STYLE, couponState, describeDiscount, formatChileDate,
} from '@/lib/coupons'
import type { Coupon } from '@/lib/types/database'

type UsageRow = { coupon_code: string; discount: number; total: number; created_at: string }
type Usage = { orders: number; discount: number; revenue: number; lastUsed: string | null }

export default async function AdminCouponsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const [{ data: couponsRaw }, { data: usageRaw }] = await Promise.all([
    supabase.from('coupons').select('*').order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('coupon_code, discount, total, created_at')
      .not('coupon_code', 'is', null)
      .in('status', PAID_STATUSES),
  ])

  const coupons = (couponsRaw ?? []) as Coupon[]

  const usage = new Map<string, Usage>()
  for (const row of (usageRaw ?? []) as UsageRow[]) {
    const key = row.coupon_code.toUpperCase()
    const u = usage.get(key) ?? { orders: 0, discount: 0, revenue: 0, lastUsed: null }
    u.orders   += 1
    u.discount += Number(row.discount)
    u.revenue  += Number(row.total)
    if (!u.lastUsed || row.created_at > u.lastUsed) u.lastUsed = row.created_at
    usage.set(key, u)
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-white tracking-wide">Cupones</h2>
          <p className="text-neutral-500 text-sm mt-1">{coupons.length} cupón{coupons.length !== 1 ? 'es' : ''}</p>
        </div>
        <Link href="/admin/coupons/new"
              className="px-4 py-2 bg-white text-black text-xs font-medium tracking-widest uppercase rounded hover:bg-neutral-200 transition-colors">
          + Nuevo cupón
        </Link>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-20 text-neutral-600">
          <p>Aún no hay cupones.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                {['Código', 'Descuento', 'Usos', 'Vence', 'Último uso', 'Descuento otorgado', 'Ventas', 'Estado', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-neutral-500 tracking-wider uppercase font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const state = couponState(coupon)
                const u = usage.get(coupon.code.toUpperCase())
                return (
                  <tr key={coupon.id} className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/20 transition-colors">
                    <td className="px-5 py-3 font-mono text-neutral-200">{coupon.code}</td>
                    <td className="px-5 py-3 text-neutral-300 whitespace-nowrap">
                      {describeDiscount(coupon)}
                      {coupon.min_purchase !== null && (
                        <p className="text-neutral-600 text-xs">mín. {formatPrice(Number(coupon.min_purchase))}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-neutral-300 whitespace-nowrap">
                      {coupon.current_uses}{coupon.max_uses !== null ? ` / ${coupon.max_uses}` : ''}
                    </td>
                    <td className="px-5 py-3 text-neutral-400 whitespace-nowrap">
                      {coupon.expires_at ? formatChileDate(coupon.expires_at) : '—'}
                    </td>
                    <td className="px-5 py-3 text-neutral-400 whitespace-nowrap">
                      {u?.lastUsed ? formatChileDate(u.lastUsed) : '—'}
                    </td>
                    <td className="px-5 py-3 text-neutral-300 whitespace-nowrap">{u ? formatPrice(u.discount) : '—'}</td>
                    <td className="px-5 py-3 text-neutral-300 whitespace-nowrap">{u ? formatPrice(u.revenue) : '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${COUPON_STATE_STYLE[state]}`}>
                        {COUPON_STATE_LABEL[state]}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap space-x-4">
                      <Link href={`/admin/coupons/${coupon.id}`}
                            className="text-xs text-neutral-400 hover:text-white transition-colors border border-neutral-700 hover:border-neutral-500 px-3 py-1.5 rounded">
                        Ver usos / editar
                      </Link>
                      <CouponActiveToggle id={coupon.id} isActive={coupon.is_active} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
