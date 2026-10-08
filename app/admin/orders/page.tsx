import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrice } from '@/lib/utils'
import type { Order, ShippingAddress } from '@/lib/types/database'

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-950/50 text-yellow-400 border-yellow-900/50',
  paid:      'bg-blue-950/50 text-blue-400 border-blue-900/50',
  shipped:   'bg-purple-950/50 text-purple-400 border-purple-900/50',
  delivered: 'bg-green-950/50 text-green-400 border-green-900/50',
  cancelled: 'bg-red-950/50 text-red-400 border-red-900/50',
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pendiente',
  paid:      'Pagado',
  shipped:   'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export default async function AdminOrdersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  const orders = (ordersRaw ?? []) as Order[]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-white tracking-wide">Órdenes</h2>
          <p className="text-neutral-500 text-sm mt-1">{orders.length} orden{orders.length !== 1 ? 'es' : ''} en total</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-neutral-600">
          <p>Aún no hay órdenes registradas.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                {['ID', 'Fecha', 'Cliente', 'Método de Pago', 'Total', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-neutral-500 tracking-wider uppercase font-normal">
                    {h}
                  </th>
                ))}
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
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-neutral-300 font-medium">{addr.full_name}</p>
                      <p className="text-neutral-500 text-xs">{addr.email}</p>
                    </td>
                    <td className="px-5 py-3 text-neutral-400 capitalize">
                      {order.payment_provider === 'mercadopago' ? 'Mercado Pago' : order.payment_provider === 'webpay' ? 'Webpay' : '—'}
                    </td>
                    <td className="px-5 py-3 text-neutral-300 font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status] ?? 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs text-neutral-400 hover:text-white transition-colors border border-neutral-700 hover:border-neutral-500 px-3 py-1.5 rounded"
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