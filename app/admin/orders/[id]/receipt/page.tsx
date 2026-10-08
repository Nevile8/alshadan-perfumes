import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrice } from '@/lib/utils'
import { getMPPayment, MP_PAYMENT_TYPE_LABELS, MP_STATUS_LABELS } from '@/lib/mercadopago'
import { PrintButton } from '@/components/admin/PrintButton'
import type { Order, OrderItem, ShippingAddress } from '@/lib/types/database'

type PageProps = { params: Promise<{ id: string }> }

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pendiente de pago',
  paid:      'Pagado',
  shipped:   'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

/**
 * Printable purchase receipt for one order. "Descargar PDF" opens the
 * browser print dialog, where the page can be saved as a PDF.
 */
export default async function OrderReceiptPage({ params }: PageProps) {
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
  const orderNumber = order.id.slice(0, 8).toUpperCase()
  const payment = order.payment_provider === 'mercadopago' && order.payment_reference
    ? await getMPPayment(order.payment_reference)
    : null

  const paymentRows = payment
    ? [
        { label: 'N° de operación', value: String(payment.id) },
        { label: 'Estado',          value: MP_STATUS_LABELS[payment.status] ?? payment.status },
        { label: 'Fecha de pago',   value: payment.date_approved ? new Date(payment.date_approved).toLocaleString('es-CL') : null },
        { label: 'Medio de pago',   value: [MP_PAYMENT_TYPE_LABELS[payment.payment_type_id ?? ''] ?? payment.payment_type_id, payment.payment_method_id?.toUpperCase()].filter(Boolean).join(' · ') },
        { label: 'Tarjeta',         value: payment.card?.last_four_digits ? `**** ${payment.card.last_four_digits}` : null },
        { label: 'Titular',         value: payment.card?.cardholder?.name },
        { label: 'Cuotas',          value: payment.installments ? String(payment.installments) : null },
        { label: 'Correo pagador',  value: payment.payer?.email },
        { label: 'Total pagado',    value: formatPrice(Number(payment.transaction_details?.total_paid_amount ?? payment.transaction_amount)) },
      ].filter((r) => r.value)
    : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/admin/orders/${order.id}`} className="text-xs text-neutral-500 hover:text-white transition-colors">
          ← Volver a la orden #{orderNumber}
        </Link>
        <PrintButton />
      </div>

      {/* Receipt — light theme so it prints cleanly */}
      <article className="max-w-3xl mx-auto bg-white text-neutral-900 rounded-lg p-10 print:p-0 print:rounded-none print:max-w-none">
        <header className="flex items-start justify-between border-b border-neutral-200 pb-6 mb-6">
          <div>
            <p className="text-2xl font-light tracking-[0.3em] uppercase">Alshadan</p>
            <p className="text-xs text-neutral-500 mt-1">Perfumes de lujo · Chile</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold uppercase tracking-wider">Comprobante de compra</p>
            <p className="text-sm font-mono mt-1">Orden #{orderNumber}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {new Date(order.created_at).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
            <p className="text-xs mt-1">{STATUS_LABELS[order.status] ?? order.status}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Cliente</h2>
            <p className="font-medium">{addr.full_name}</p>
            <p>RUT: {addr.rut}</p>
            <p>{addr.email}</p>
            <p>{addr.phone}</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Despacho</h2>
            <p>{addr.address}</p>
            <p>{addr.commune}, {addr.region}</p>
            <p>{addr.country ?? 'Chile'}</p>
            {addr.extra_info && <p className="text-neutral-500">{addr.extra_info}</p>}
            {order.tracking_number && <p className="mt-1">Seguimiento: {order.tracking_number}</p>}
          </div>
        </section>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-neutral-300 text-xs uppercase tracking-wider text-neutral-500">
              <th className="text-left py-2 font-normal">Producto</th>
              <th className="text-center py-2 font-normal">Cant.</th>
              <th className="text-right py-2 font-normal">Precio unit.</th>
              <th className="text-right py-2 font-normal">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-100">
                <td className="py-2">{item.product_name} · {item.size_ml} ml</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">{formatPrice(item.unit_price)}</td>
                <td className="py-2 text-right">{formatPrice(item.unit_price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto w-64 space-y-1 text-sm mb-8">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt>Descuento{order.coupon_code ? ` (${order.coupon_code})` : ''}</dt>
              <dd>- {formatPrice(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between"><dt>Envío</dt><dd>{formatPrice(order.shipping_cost)}</dd></div>
          <div className="flex justify-between border-t border-neutral-300 pt-2 font-semibold text-base">
            <dt>Total</dt><dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>

        <section className="border-t border-neutral-200 pt-6 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Pago</h2>
          {paymentRows.length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-1">
              {paymentRows.map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-neutral-500">{label}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-neutral-500">
              {order.payment_reference
                ? `Pago Mercado Pago #${order.payment_reference}`
                : 'Pago aún no registrado.'}
            </p>
          )}
        </section>

        <p className="text-[10px] text-neutral-400 mt-10 text-center">
          Este comprobante no reemplaza la boleta o factura electrónica.
        </p>
      </article>
    </div>
  )
}
