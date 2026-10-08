import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Mercado Pago Webhook Handler
 *
 * MP sends a POST when payment status changes.
 * We fetch payment details from MP API, verify approval,
 * then update the order status in Supabase.
 *
 * Required .env.local variable:
 *   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchMPPayment(paymentId: string): Promise<any> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured')

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`MP API error: ${res.status}`)
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    // MP sends: { type: 'payment', data: { id: '...' } }
    // or:       { topic: 'payment', id: '...' }
    const paymentId = body?.data?.id ?? body?.id

    if (body?.type !== 'payment' && body?.topic !== 'payment') {
      // Ignore non-payment notifications (subscriptions, etc.)
      return NextResponse.json({ received: true })
    }

    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    const payment = await fetchMPPayment(String(paymentId))

    // external_reference is set to our order.id when creating the MP Preference
    const orderId = payment?.external_reference
    if (!orderId) {
      return NextResponse.json({ error: 'No external_reference' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    if (payment.status === 'approved') {
      await supabase
        .from('orders')
        .update({
          status:            'paid',
          payment_reference: String(paymentId),
        })
        .eq('id', orderId)
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[MP Webhook Error]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// MP also sends a GET to verify the endpoint exists
export async function GET() {
  return NextResponse.json({ ok: true })
}