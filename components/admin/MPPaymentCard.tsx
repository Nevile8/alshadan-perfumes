import { formatPrice } from '@/lib/utils'
import { MP_PAYMENT_TYPE_LABELS, MP_STATUS_LABELS, type MPPayment } from '@/lib/mercadopago'

/** Payment details fetched live from Mercado Pago, for the admin order page. */
export function MPPaymentCard({ payment }: { payment: MPPayment }) {
  const fees = (payment.fee_details ?? []).reduce((sum, f) => sum + Number(f.amount), 0)
  const paid = payment.transaction_details?.total_paid_amount ?? payment.transaction_amount
  const payerName = [payment.payer?.first_name, payment.payer?.last_name].filter(Boolean).join(' ')
    || payment.card?.cardholder?.name
  const payerId = payment.payer?.identification?.number
    ? `${payment.payer.identification.type ?? ''} ${payment.payer.identification.number}`.trim()
    : null

  const rows = [
    { label: 'Operación',   value: `#${payment.id}` },
    { label: 'Estado',      value: MP_STATUS_LABELS[payment.status] ?? payment.status },
    { label: 'Fecha',       value: payment.date_approved ? new Date(payment.date_approved).toLocaleString('es-CL') : null },
    { label: 'Medio',       value: [MP_PAYMENT_TYPE_LABELS[payment.payment_type_id ?? ''] ?? payment.payment_type_id, payment.payment_method_id?.toUpperCase()].filter(Boolean).join(' · ') },
    { label: 'Tarjeta',     value: payment.card?.last_four_digits ? `**** ${payment.card.last_four_digits}` : null },
    { label: 'Cuotas',      value: payment.installments ? String(payment.installments) : null },
    { label: 'Pagador',     value: payerName || null },
    { label: 'Correo MP',   value: payment.payer?.email },
    { label: 'Documento',   value: payerId },
    { label: 'Total pagado', value: formatPrice(Number(paid)) },
    { label: 'Comisión MP', value: fees > 0 ? `- ${formatPrice(fees)}` : null },
    { label: 'Neto recibido', value: payment.transaction_details?.net_received_amount != null
        ? formatPrice(Number(payment.transaction_details.net_received_amount)) : null },
  ].filter((r) => r.value)

  return (
    <dl className="space-y-2 text-sm">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between gap-4 text-neutral-400">
          <dt className="shrink-0">{label}</dt>
          <dd className="text-neutral-200 text-right break-all">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
