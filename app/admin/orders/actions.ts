'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { OrderStatus } from '@/lib/types/database'

export async function updateOrderFulfillment(
  orderId: string,
  status: OrderStatus,
  trackingNumber: string | null,
  trackingUrl: string | null
): Promise<{ error: string | null }> {
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

  const { error } = await supabase
    .from('orders')
    .update(update)
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  return { error: null }
}