import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrice } from '@/lib/utils'
import { ORDER_STATUSES, ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from '@/lib/order-status'
import type { Order, OrderStatus, ShippingAddress } from '@/lib/types/database'

type SortKey = 'date' | 'client' | 'payment' | 'total' | 'status'
type Dir = 'asc' | 'desc'

type PageProps = { searchParams: Promise<{ sort?: string; dir?: string; status?: string }> }

const COLUMNS: { key: SortKey | null; label: string; firstDir: Dir }[] = [
  { key: null,      label: 'ID',             firstDir: 'asc' },
  { key: 'date',    label: 'Fecha',          firstDir: 'desc' },
  { key: 'client',  label: 'Cliente',        firstDir: 'asc' },
  { key: 'payment', label: 'Método de Pago', firstDir: 'asc' },
  { key: 'total',   label: 'Total',          firstDir: 'desc' },
  { key: 'status',  label: 'Estado',         firstDir: 'asc' },
  { key: null,      label: 'Acciones',       firstDir: 'asc' },
]

const SORT_KEYS: SortKey[] = ['date', 'client', 'payment', 'total', 'status']

function paymentLabel(order: Order): string {
  return order.payment_provider === 'mercadopago' ? 'Mercado Pago'
    : order.payment_provider === 'webpay' ? 'Webpay' : '—'
}

function compare(a: Order, b: Order, key: SortKey): number {
  switch (key) {
    case 'date':    return a.created_at.localeCompare(b.created_at)
    case 'total':   return Number(a.total) - Number(b.total)
    case 'status':  return ORDER_STATUSES.indexOf(a.status) - ORDER_STATUSES.indexOf(b.status)
    case 'payment': return paymentLabel(a).localeCompare(paymentLabel(b), 'es')
    case 'client':
      return ((a.shipping_address as ShippingAddress)?.full_name ?? '')
        .localeCompare((b.shipping_address as ShippingAddress)?.full_name ?? '', 'es', { sensitivity: 'base' })
  }
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const sort: SortKey = SORT_KEYS.includes(params.sort as SortKey) ? (params.sort as SortKey) : 'date'
  const dir: Dir = params.dir === 'asc' || params.dir === 'desc' ? params.dir : (sort === 'date' || sort === 'total' ? 'desc' : 'asc')
  const statusFilter = ORDER_STATUSES.includes(params.status as OrderStatus) ? (params.status as OrderStatus) : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (statusFilter) query = query.eq('status', statusFilter)
  const { data: ordersRaw } = await query

  const orders = ((ordersRaw ?? []) as Order[]).sort((a, b) => {
    const result = compare(a, b, sort) || b.created_at.localeCompare(a.created_at)
    return dir === 'asc' ? result : -result
  })

  function href(next: { sort?: SortKey; dir?: Dir; status?: OrderStatus | null }) {
    const q = new URLSearchParams()
    const s = next.sort ?? sort
    q.set('sort', s)
    q.set('dir', next.dir ?? dir)
    const st = next.status === undefined ? statusFilter : next.status
    if (st) q.set('status', st)
    return `/admin/orders?${q.toString()}`
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-white tracking-wide">Órdenes</h2>
          <p className="text-neutral-500 text-sm mt-1">
            {orders.length} orden{orders.length !== 1 ? 'es' : ''}{statusFilter ? ` · ${ORDER_STATUS_LABEL[statusFilter]}` : ' en total'}
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={href({ status: null })}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!statusFilter ? 'bg-white text-black border-white' : 'text-neutral-400 border-neutral-700 hover:border-neutral-500'}`}>
          Todas
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={href({ status: s })}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${statusFilter === s ? ORDER_STATUS_BADGE[s] + ' ring-1 ring-current' : 'text-neutral-400 border-neutral-700 hover:border-neutral-500'}`}>
            {ORDER_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-neutral-600">
          <p>{statusFilter ? 'No hay órdenes con este estado.' : 'Aún no hay órdenes registradas.'}</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                {COLUMNS.map((col) => {
                  const active = col.key !== null && col.key === sort
                  return (
                    <th key={col.label} className="text-left px-5 py-3 text-xs tracking-wider uppercase font-normal whitespace-nowrap"
                        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                      {col.key ? (
                        <Link
                          href={href({ sort: col.key, dir: active ? (dir === 'asc' ? 'desc' : 'asc') : col.firstDir })}
                          className={`inline-flex items-center gap-1 transition-colors ${active ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                          {col.label}
                          <span className="text-[10px]">{active ? (dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                        </Link>
                      ) : (
                        <span className="text-neutral-500">{col.label}</span>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const addr = order.shipping_address as ShippingAddress
                return (
                  <tr key={order.id} className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/20 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-neutral-400">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 text-neutral-400 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('es-CL', {
                        timeZone: 'America/Santiago', day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-neutral-300 font-medium">{addr.full_name}</p>
                      <p className="text-neutral-500 text-xs">{addr.email}</p>
                    </td>
                    <td className="px-5 py-3 text-neutral-400">{paymentLabel(order)}</td>
                    <td className="px-5 py-3 text-neutral-300 font-medium whitespace-nowrap">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${ORDER_STATUS_BADGE[order.status] ?? 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
                        {ORDER_STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs text-neutral-400 hover:text-white transition-colors border border-neutral-700 hover:border-neutral-500 px-3 py-1.5 rounded whitespace-nowrap"
                      >
                        Ver detalles →
                      </Link>
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
