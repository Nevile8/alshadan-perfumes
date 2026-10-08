/**
 * Server-side helpers for the Mercado Pago REST API.
 * Never import from a Client Component: it uses MERCADOPAGO_ACCESS_TOKEN.
 */

/** Subset of https://www.mercadopago.cl/developers/es/reference/payments/_payments_id/get */
export interface MPPayment {
  id: number
  status: string
  status_detail: string | null
  date_created: string | null
  date_approved: string | null
  payment_method_id: string | null
  payment_type_id: string | null
  installments: number | null
  currency_id: string
  transaction_amount: number
  shipping_amount: number | null
  transaction_details: {
    total_paid_amount: number | null
    net_received_amount: number | null
    installment_amount: number | null
  } | null
  fee_details: { type: string; amount: number }[] | null
  card: {
    last_four_digits: string | null
    cardholder: { name: string | null; identification: { type: string | null; number: string | null } | null } | null
  } | null
  payer: {
    email: string | null
    first_name: string | null
    last_name: string | null
    identification: { type: string | null; number: string | null } | null
    phone: { area_code: string | null; number: string | null } | null
  } | null
  external_reference: string | null
}

/** Returns null when the token is missing or MP doesn't return the payment. */
export async function getMPPayment(paymentId: string): Promise<MPPayment | null> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token || !/^\d+$/.test(paymentId)) return null

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('[MP] get payment', paymentId, res.status)
      return null
    }
    return (await res.json()) as MPPayment
  } catch (err) {
    console.error('[MP] get payment', paymentId, err)
    return null
  }
}

export const MP_STATUS_LABELS: Record<string, string> = {
  approved:     'Aprobado',
  pending:      'Pendiente',
  in_process:   'En revisión',
  authorized:   'Autorizado',
  rejected:     'Rechazado',
  cancelled:    'Cancelado',
  refunded:     'Reembolsado',
  charged_back: 'Contracargo',
  in_mediation: 'En mediación',
}

export const MP_PAYMENT_TYPE_LABELS: Record<string, string> = {
  credit_card:   'Tarjeta de crédito',
  debit_card:    'Tarjeta de débito',
  prepaid_card:  'Tarjeta prepago',
  account_money: 'Dinero en cuenta Mercado Pago',
  ticket:        'Efectivo',
  bank_transfer: 'Transferencia bancaria',
}
