import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Mercado Pago Webhook Handler
 *
 * MP sends a POST when payment status changes.
 * We fetch payment details from MP API, verify approval and amount,
 * then update the order status in Supabase.
 *
 * Required env variables:
 *   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
 *   MERCADOPAGO_WEBHOOK_SECRET=...   (Tus integraciones > Webhooks > Clave secreta)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchMPPayment(paymentId: string): Promise<any> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured')

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`MP API error: ${res.status}`)
  return res.json()
}

/**
 * Validates the x-signature header as documented by Mercado Pago:
 * HMAC-SHA256 of "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" with the webhook secret.
 */
function isValidSignature(req: NextRequest, dataId: string, secret: string): boolean {
  const signature = req.headers.get('x-signature') ?? ''
  const requestId = req.headers.get('x-request-id') ?? ''

  const parts = Object.fromEntries(
    signature.split(',').map((part) => {
      const [key, ...rest] = part.trim().split('=')
      return [key, rest.join('=')]
    })
  )
  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  // MP lowercases alphanumeric ids in the signed manifest
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId
  let manifest = `id:${id};`
  if (requestId) manifest += `request-id:${requestId};`
  manifest += `ts:${ts};`

  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(v1)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const query = req.nextUrl.searchParams

    // MP sends: { type: 'payment', data: { id: '...' } }
    // or:       { topic: 'payment', id: '...' }
    const type = body?.type ?? body?.topic ?? query.get('type') ?? query.get('topic')
    const paymentId = body?.data?.id ?? query.get('data.id') ?? body?.id ?? query.get('id')

    if (type !== 'payment') {
      // Ignore non-payment notifications (merchant_order, subscriptions, etc.)
      return NextResponse.json({ received: true })
    }

    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    if (secret) {
      if (!isValidSignature(req, String(query.get('data.id') ?? paymentId), secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } else {
      console.warn('[MP Webhook] MERCADOPAGO_WEBHOOK_SECRET not set — signature not verified')
    }

    // Always re-fetch from MP: never trust the notification body for status or amount
    const payment = await fetchMPPayment(String(paymentId))

    // external_reference is set to our order.id when creating the MP Preference
    const orderId = payment?.external_reference
    if (!orderId) {
      return NextResponse.json({ error: 'No external_reference' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, total')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order) {
      console.warn('[MP Webhook] Unknown order', orderId)
      return NextResponse.json({ received: true })
    }

    if (payment.status === 'approved') {
      const paid = Number(payment.transaction_amount)
      if (payment.currency_id !== 'CLP' || paid < Number(order.total)) {
        console.error('[MP Webhook] Amount mismatch — order left pending for manual review', {
          orderId, paymentId, paid, currency: payment.currency_id, expected: order.total,
        })
        return NextResponse.json({ received: true })
      }

      // Atomic: pending → paid, decrement stock, count coupon use (migration 004)
      const { error } = await supabase.rpc('mark_order_paid', {
        p_order_id:          orderId,
        p_payment_reference: String(paymentId),
      })
      if (error) throw error
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      // A rejected card attempt doesn't end the checkout: the buyer can retry with
      // another card on the same preference. Only cancel orders still pending
      // once MP reports the payment itself as cancelled (e.g. expired).
      if (payment.status === 'cancelled') {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId)
          .eq('status', 'pending')
        if (error) throw error
      }
    } else if (payment.status === 'refunded' || payment.status === 'charged_back') {
      // Needs a human decision (restock? already shipped?) — surface it in the logs
      console.warn(`[MP Webhook] Payment ${payment.status} for order ${orderId} (payment ${paymentId})`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[MP Webhook Error]', err)
    // 500 makes Mercado Pago retry the notification later
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// MP also sends a GET to verify the endpoint exists
export async function GET() {
  return NextResponse.json({ ok: true })
}
