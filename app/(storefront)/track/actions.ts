'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Order, OrderItem, ShippingAddress } from '@/lib/types/database'

export type OrderLookupResult = {
  order: Order & { order_items: OrderItem[] }
  error: null
} | {
  order: null
  error: string
}

export async function lookupOrder(
  orderId: string,
  email: string
): Promise<OrderLookupResult> {
  const trimId    = orderId.trim()
  const trimEmail = email.trim().toLowerCase()

  if (!trimId || !trimEmail) {
    return { order: null, error: 'Completa ambos campos.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', trimId)
    .single()

  if (error || !data) {
    return { order: null, error: 'No encontramos una orden con ese número.' }
  }

  const order = data as Order & { order_items: OrderItem[] }
  const addr  = order.shipping_address as ShippingAddress

  // Security check — email must match the billing email
  if (addr.email.toLowerCase() !== trimEmail) {
    return { order: null, error: 'El correo no coincide con el registrado para esta orden.' }
  }

  return { order, error: null }
}