'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { sendOrderCancelledEmail, sendOrderShippedEmail } from '@/lib/email'
import type { Order, OrderStatus } from '@/lib/types/database'
import { LIMITS, UUID_RE, cleanString, safeHttpUrl } from '@/lib/limits'

const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

export async function updateOrderFulfillment(
  orderId: string,
  status: OrderStatus,
  trackingNumber: string | null,
  trackingUrl: string | null
): Promise<{ error: string | null }> {
  await requireAdmin()
  if (typeof orderId !== 'string' || !UUID_RE.test(orderId)) return { error: 'Orden no válida.' }
  if (!ORDER_STATUSES.includes(status)) return { error: 'Estado no válido.' }

  const number = cleanString(trackingNumber ?? '', LIMITS.trackingNumber)
  const url    = cleanString(trackingUrl ?? '', LIMITS.trackingUrl)
  if (number === null) return { error: `El número de tracking admite máximo ${LIMITS.trackingNumber} caracteres.` }
  // The link is shown to the customer on /track and in emails: http(s) only
  if (url === null || (url && !safeHttpUrl(url))) return { error: 'La URL de seguimiento debe empezar con https://' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const update: Record<string, unknown> = { status }
  if (status === 'shipped') {
    update.tracking_number = number || null
    update.tracking_url    = url    || null
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