import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrice } from '@/lib/utils'
import { CouponForm } from '@/components/admin/CouponForm'
import { CouponActiveToggle } from '@/components/admin/CouponActiveToggle'
import {
  PAID_STATUSES, COUPON_STATE_LABEL, COUPON_STATE_STYLE, couponState, describeDiscount, formatChileDate,
} from '@/lib/coupons'
import type { Coupon, Order, ShippingAddress } from '@/lib/types/database'

type PageProps = { params: Promise<{ id: string }> }

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pagado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

export default async function CouponDetailPage({ params }: PageProps) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { data: couponData } = await supabase.from('coupons').select('*').eq('id', id).maybeSingle()
  if (!couponData) notFound()
  const coupon = couponData as Coupon

  // Pending orders are abandoned or unpaid checkouts, so they are not uses
  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('id, status, subtotal, discount, total, created_at, shipping_address')
    .ilike('coupon_code', escapeLike(coupon.code))
    .neq('status', 'pending')
    .order('created_at', { ascending: false })

  const orders = (ordersRaw ?? []) as Pick<Order, 'id' | 'status' | 'subtotal' | 'discount' | 'total' | 'created_at' | 'shipping_address'>[]
  const paid   = orders.filter((o) => PAID_STATUSES.includes(o.status))
  const totalDiscount = paid.reduce((sum, o) => sum + Number(o.discount), 0)
  const totalRevenue  = paid.reduce((sum, o) => sum + Number(o.total), 0)
  const state = couponState(coupon)

  const stats = [
    { label: 'Usos', value: `${coupon.current_uses}${coupon.max_uses !== null ? ` / ${coupon.max_uses}` : ''}`,
      sub: coupon.max_uses !== null ? `${Math.max(coupon.max_uses - coupon.current_uses, 0)} restantes` : 'Sin límite' },
    { label: 'Descuento otorgado', value: formatPrice(totalDiscount), sub: `en ${paid.length} pedido${paid.length !== 1 ? 's' : ''} pagado${paid.length !== 1 ? 's' : ''}` },
    { label: 'Ventas con el cupón', value: formatPrice(totalRevenue), sub: 'Total pagado, con envío' },
    { label: 'Vence', value: coupon.expires_at ? formatChileDate(coupon.expires_at) : 'No vence',
      sub: paid[0] ? `Último uso: ${formatChileDate(paid[0].created_at)}` : 'Aún sin usos' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/coupons" className="text-xs text-neutral-500 hover:text-white transition-colors">← Cupones</Link>
          <h2 className="text-2xl font-light text-white tracking-wide mt-2 flex items-center gap-3">
            <span className="font-mono">{coupon.code}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${COUPON_STATE_STYLE[state]}`}>{COUPON_STATE_LABEL[state]}</span>
          </h2>
          <p className="text-neutral-500 text-sm mt-1">
            {describeDiscount(coupon)} de descuento
            {coupon.min_purchase !== null ? ` · compra mínima ${formatPrice(Number(coupon.min_purchase))}` : ''}
            {' · '}creado el {formatChileDate(coupon.created_at)}
          </p>
        </div>
        <CouponActiveToggle id={coupon.id} isActive={coupon.is_active} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <p className="text-neutral-500 text-xs tracking-wider uppercase mb-2">{stat.label}</p>
            <p className="text-2xl font-light text-white mb-1">{stat.value}</p>
            <p className="text-neutral-600 text-xs">{stat.sub}</p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="text-sm text-neutral-300 uppercase tracking-wider mb-3">Historial de usos</h3>
        {orders.length === 0 ? (
          <p className="text-neutral-600 text-sm">Ningún pedido pagado ha usado este cupón todavía.</p>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  {['Fecha', 'Orden', 'Cliente', 'Subtotal', 'Descuento', 'Total', 'Estado'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-neutral-500 tracking-wider uppercase font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const addr = order.shipping_address as ShippingAddress
                  return (
                    <tr key={order.id} className="border-b border-neutral-800/50 last:border-0">
                      <td className="px-5 py-3 text-neutral-400 whitespace-nowrap">{formatChileDate(order.created_at, true)}</td>
                      <td className="px-5 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-neutral-300 hover:text-white underline underline-offset-2">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-neutral-300">{addr.full_name}</p>
                        <p className="text-neutral-500 text-xs">{addr.email}</p>
                      </td>
                      <td className="px-5 py-3 text-neutral-400 whitespace-nowrap">{formatPrice(Number(order.subtotal))}</td>
                      <td className="px-5 py-3 text-green-400 whitespace-nowrap">− {formatPrice(Number(order.discount))}</td>
                      <td className="px-5 py-3 text-neutral-200 whitespace-nowrap">{formatPrice(Number(order.total))}</td>
                      <td className="px-5 py-3 text-neutral-400">{STATUS_LABELS[order.status] ?? order.status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-neutral-600 text-xs mt-2">
          Los usos se cuentan cuando el pago se confirma. Los pedidos cancelados se muestran pero no suman al descuento ni a las ventas.
        </p>
      </section>

      <section>
        <h3 className="text-sm text-neutral-300 uppercase tracking-wider mb-3">Editar</h3>
        <CouponForm coupon={coupon} />
      </section>
    </div>
  )
}
