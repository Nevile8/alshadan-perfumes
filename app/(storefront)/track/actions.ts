'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Order, OrderItem, ShippingAddress } from '@/lib/types/database'
import { LIMITS, cleanString } from '@/lib/limits'

export type OrderLookupResult = {
  order: Order & { order_items: OrderItem[] }
  error: null
} | {
  order: null
  error: string
}

const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const SHORT_RE = /^[0-9a-f]{8}$/

/**
 * Finds an order by number + checkout email. The number can be the full ID or the
 * 8-character code customers see ("#3F2A91BC"), with or without "#".
 */
export async function lookupOrder(
  orderId: string,
  email: string
): Promise<OrderLookupResult> {
  const code      = (cleanString(orderId, LIMITS.orderCode) ?? '').replace(/^#/, '').toLowerCase()
  const trimEmail = (cleanString(email, LIMITS.email) ?? '').toLowerCase()

  if (!code || !trimEmail) {
    return { order: null, error: 'Completa ambos campos.' }
  }

  // Same message for "not found" and "wrong email" so order IDs can't be probed
  const notFound = 'No encontramos una orden con ese número y correo.'

  if (!UUID_RE.test(code) && !SHORT_RE.test(code)) {
    return { order: null, error: notFound }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  // Orders are looked up through the email they were placed with; the number
  // then has to match one of them, so a short code can never leak another
  // customer's order.
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .ilike('shipping_address->>email', trimEmail.replace(/[\\%_]/g, '\\$&'))
    .order('created_at', { ascending: false })
    .limit(200)

  if (error || !data) {
    return { order: null, error: notFound }
  }

  const orders = data as (Order & { order_items: OrderItem[] })[]
  const order  = orders.find((o) => (code.length === 8 ? o.id.startsWith(code) : o.id === code))

  // Double-check the email on the order itself
  const addr = order?.shipping_address as ShippingAddress | undefined
  if (!order || addr?.email?.toLowerCase() !== trimEmail) {
    return { order: null, error: notFound }
  }

  return { order, error: null }
}
