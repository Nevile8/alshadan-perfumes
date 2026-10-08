import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrice } from '@/lib/utils'
import { OrderFulfillmentForm } from '@/components/admin/OrderFulfillmentForm'
import { MPPaymentCard } from '@/components/admin/MPPaymentCard'
import { getMPPayment } from '@/lib/mercadopago'
import type { Order, OrderItem, ShippingAddress } from '@/lib/types/database'

type PageProps = { params: Promise<{ id: string }> }

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pendiente',
  paid:      'Pagado',
  shipped:   'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const order = data as Order & { order_items: OrderItem[] }
  const addr  = order.shipping_address as ShippingAddress
  const payment = order.payment_provider === 'mercadopago' && order.payment_reference
    ? await getMPPayment(order.payment_reference)
    : null

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
        <Link href="/admin/orders" className="hover:text-white transition-colors">Órdenes</Link>
        <span>/</span>
        <span className="text-neutral-300 font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-xl font-light text-white tracking-wide">
            Orden #{order.id.slice(0, 8).toUpperCase()}
          </h2>
          <p className="text-neutral-500 text-sm mt-1">
            {new Date(order.created_at).toLocaleDateString('es-CL', {
              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/orders/${order.id}/receipt`}
            className="text-xs px-3 py-1.5 rounded border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
          >
            Ver comprobante
          </Link>
          <span className="text-xs px-3 py-1.5 rounded-full border bg-neutral-800 text-neutral-300 border-neutral-700">
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Customer + Shipping ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Customer Info */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Información del Cliente
            </h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                { label: 'Nombre',  value: addr.full_name },
                { label: 'RUT',     value: addr.rut },
                { label: 'Correo',  value: addr.email },
                { label: 'Teléfono', value: addr.phone },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-neutral-500 text-xs uppercase tracking-wide">{label}</dt>
                  <dd className="text-neutral-200 mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Shipping Address */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Dirección de Envío
            </h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                { label: 'Dirección',  value: addr.address },
                { label: 'Comuna',     value: addr.commune },
                { label: 'Región',     value: addr.region },
                { label: 'País',       value: addr.country ?? 'Chile' },
                ...(addr.extra_info ? [{ label: 'Info adicional', value: addr.extra_info }] : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-neutral-500 text-xs uppercase tracking-wide">{label}</dt>
                  <dd className="text-neutral-200 mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Items */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-800">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Productos ({order.order_items.length})
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800/50">
                  <th className="text-left px-5 py-2.5 text-xs text-neutral-500 font-normal uppercase tracking-wider">Producto</th>
                  <th className="text-left px-5 py-2.5 text-xs text-neutral-500 font-normal uppercase tracking-wider">Tamaño</th>
                  <th className="text-center px-5 py-2.5 text-xs text-neutral-500 font-normal uppercase tracking-wider">Cant.</th>
                  <th className="text-right px-5 py-2.5 text-xs text-neutral-500 font-normal uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-800/30 last:border-0">
                    <td className="px-5 py-3 text-neutral-300">{item.product_name}</td>
                    <td className="px-5 py-3 text-neutral-400">{item.size_ml} ml</td>
                    <td className="px-5 py-3 text-neutral-400 text-center">{item.quantity}</td>
                    <td className="px-5 py-3 text-neutral-300 text-right font-medium">
                      {formatPrice(item.unit_price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: Totals + Fulfillment ─────────────────────────────────── */}
        <div className="space-y-5">
          {/* Totals */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Resumen del Pago
            </h3>
            <dl className="space-y-2 text-sm">
              {[
                { label: 'Subtotal',           value: formatPrice(order.subtotal) },
                { label: 'Envío',              value: formatPrice(order.shipping_cost) },
                ...(order.discount > 0 ? [{ label: 'Descuento', value: `- ${formatPrice(order.discount)}` }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-neutral-400">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
              <div className="border-t border-neutral-800 pt-3 flex justify-between text-white font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
            {order.payment_provider && (
              <p className="text-xs text-neutral-500 mt-3 pt-3 border-t border-neutral-800">
                Método: <span className="text-neutral-300 capitalize">
                  {order.payment_provider === 'mercadopago' ? 'Mercado Pago' : 'Webpay'}
                </span>
              </p>
            )}
            {order.coupon_code && (
              <p className="text-xs text-neutral-500 mt-1">
                Cupón: <span className="text-neutral-300 font-mono">{order.coupon_code}</span>
              </p>
            )}
          </div>

          {/* Mercado Pago payment */}
          {order.payment_reference && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                Pago en Mercado Pago
              </h3>
              {payment ? (
                <MPPaymentCard payment={payment} />
              ) : (
                <p className="text-xs text-neutral-500">
                  No se pudo obtener el pago #{order.payment_reference} desde Mercado Pago.
                </p>
              )}
            </div>
          )}

          {/* Fulfillment */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Gestionar Despacho
            </h3>
            <OrderFulfillmentForm
              orderId={order.id}
              currentStatus={order.status}
              currentTrackingNumber={order.tracking_number}
              currentTrackingUrl={order.tracking_url}
            />
          </div>
        </div>
      </div>
    </div>
  )
}