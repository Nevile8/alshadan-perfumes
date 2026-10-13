'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { sendOrderCancelledEmail, sendOrderShippedEmail } from '@/lib/email'
import type { Order, OrderStatus } from '@/lib/types/database'

export async function updateOrderFulfillment(
  orderId: string,
  status: OrderStatus,
  trackingNumber: string | null,
  trackingUrl: string | null
): Promise<{ error: string | null }> {
  await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const update: Record<string, unknown> = { status }
  if (status === 'shipped') {
    update.tracking_number = trackingNumber?.trim() || null
    update.tracking_url    = trackingUrl?.trim()    || null
  } else if (status === 'cancelled') {
    // Clear tracking info when cancelled
    update.tracking_number = null
    update.tracking_url    = null
  }

  const { data: before } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .maybeSingle()

  const { data: updated, error } = await supabase
    .from('orders')
    .update(update)
    .eq('id', orderId)
    .select('*')
    .maybeSingle()

  if (error) return { error: error.message }

  // Notify the customer only when the status actually changes
  const order = updated as Order | null
  if (order && before?.status !== status) {
    if (status === 'shipped')   await sendOrderShippedEmail(order)
    if (status === 'cancelled') await sendOrderCancelledEmail(order)
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  return { error: null }
}