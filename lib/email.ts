import { formatPrice } from '@/lib/utils'
import type { Order, OrderItem, ShippingAddress } from '@/lib/types/database'

/**
 * Transactional email via Resend (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Required env variables:
 *   RESEND_API_KEY=re_...
 * Optional:
 *   EMAIL_FROM="ALSHADAN <pedidos@alshadan.com>"   (must be on a domain verified in Resend)
 *   EMAIL_ADMIN=contacto@alshadan.com              (receives new-order alerts and contact messages)
 *   NEXT_PUBLIC_APP_URL=https://www.alshadan.com   (used for links in emails)
 *
 * Sending never throws: a failed email is logged and must not break checkout,
 * the payment webhook or the admin panel.
 */

const DEFAULT_FROM  = 'ALSHADAN <pedidos@alshadan.com>'
const DEFAULT_ADMIN = 'contacto@alshadan.com'

type OrderWithItems = Order & { order_items: OrderItem[] }

type SendArgs = {
  to:       string | string[]
  subject:  string
  html:     string
  replyTo?: string
}

export type SendResult = { ok: true; id: string | null } | { ok: false; error: string }

/** Sends one email and reports exactly what Resend answered (used by the admin test tool). */
export async function deliverEmail({ to, subject, html, replyTo }: SendArgs): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY not set — email not sent:', subject)
    return { ok: false, error: 'RESEND_API_KEY no está configurada en el servidor.' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:     emailFrom(),
        to:       Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      cache: 'no-store',
    })
    const text = await res.text().catch(() => '')
    if (!res.ok) {
      console.error('[Email] Resend error', res.status, text)
      let message = text
      try { message = JSON.parse(text).message ?? text } catch {}
      return { ok: false, error: `Resend respondió ${res.status}: ${message || 'sin detalle'}` }
    }
    let id: string | null = null
    try { id = JSON.parse(text).id ?? null } catch {}
    return { ok: true, id }
  } catch (err) {
    console.error('[Email] Send failed', err)
    return { ok: false, error: `No se pudo contactar a Resend: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function sendEmail(args: SendArgs): Promise<boolean> {
  return (await deliverEmail(args)).ok
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM || DEFAULT_FROM
}

/** What the server is configured with, for the admin email check (never exposes the key). */
export function emailConfig() {
  return {
    hasApiKey:   Boolean(process.env.RESEND_API_KEY),
    from:        emailFrom(),
    fromIsDefault: !process.env.EMAIL_FROM,
    admin:       adminEmail(),
    adminIsDefault: !process.env.EMAIL_ADMIN,
    appUrl:      appUrl(),
    appUrlIsDefault: !process.env.NEXT_PUBLIC_APP_URL,
  }
}

export function adminEmail(): string {
  return process.env.EMAIL_ADMIN || DEFAULT_ADMIN
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://www.alshadan.com').replace(/\/$/, '')
}

// ─── Templates ────────────────────────────────────────────────────────────────

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Only http(s) links may be rendered as hrefs. */
function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch {
    return null
  }
}

function shortId(order: Order): string {
  return order.id.slice(0, 8).toUpperCase()
}

function trackUrl(order: Order): string {
  const addr = order.shipping_address as ShippingAddress
  const params = new URLSearchParams({ order: order.id, email: addr.email })
  return `${appUrl()}/track?${params.toString()}`
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#FDF9F3;font-family:Helvetica,Arial,sans-serif;color:#2C221E">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDF9F3;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E8DEC8;border-radius:16px">
        <tr><td style="padding:28px 32px 8px;text-align:center;letter-spacing:6px;font-size:20px;font-weight:300">ALSHADAN</td></tr>
        <tr><td style="padding:8px 32px 0;text-align:center;font-size:18px;font-weight:600">${esc(title)}</td></tr>
        <tr><td style="padding:20px 32px 28px;font-size:14px;line-height:1.6">${body}</td></tr>
      </table>
      <p style="font-size:12px;color:#7A6E65;margin-top:16px">ALSHADAN · Santiago, Chile · <a href="mailto:${esc(adminEmail())}" style="color:#7A6E65">${esc(adminEmail())}</a></p>
    </td></tr>
  </table>
</body>
</html>`
}

function button(href: string, label: string): string {
  return `<p style="text-align:center;margin:24px 0 8px">
    <a href="${esc(href)}" style="display:inline-block;background:#E86A33;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:13px;letter-spacing:2px;text-transform:uppercase">${esc(label)}</a>
  </p>`
}

function orderSummary(order: OrderWithItems): string {
  const rows = order.order_items.map((item) => `
    <tr>
      <td style="padding:6px 0">${esc(item.product_name)} (${esc(item.size_ml)}ml) × ${esc(item.quantity)}</td>
      <td style="padding:6px 0;text-align:right">${esc(formatPrice(item.unit_price * item.quantity))}</td>
    </tr>`).join('')

  const discount = Number(order.discount) > 0 ? `
    <tr>
      <td style="padding:4px 0;color:#7A6E65">Descuento${order.coupon_code ? ` (${esc(order.coupon_code)})` : ''}</td>
      <td style="padding:4px 0;text-align:right;color:#7A6E65">- ${esc(formatPrice(Number(order.discount)))}</td>
    </tr>` : ''

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E8DEC8;margin-top:16px;font-size:14px">
    ${rows}
    <tr><td colspan="2" style="border-top:1px solid #E8DEC8;padding-top:6px"></td></tr>
    <tr>
      <td style="padding:4px 0;color:#7A6E65">Subtotal</td>
      <td style="padding:4px 0;text-align:right;color:#7A6E65">${esc(formatPrice(Number(order.subtotal)))}</td>
    </tr>
    ${discount}
    <tr>
      <td style="padding:4px 0;color:#7A6E65">Envío</td>
      <td style="padding:4px 0;text-align:right;color:#7A6E65">${esc(formatPrice(Number(order.shipping_cost)))}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;font-weight:600">Total</td>
      <td style="padding:8px 0;text-align:right;font-weight:600">${esc(formatPrice(Number(order.total)))}</td>
    </tr>
  </table>`
}

function addressBlock(addr: ShippingAddress): string {
  return `<p style="margin:16px 0 0;color:#7A6E65">
    <strong style="color:#2C221E">Dirección de envío</strong><br>
    ${esc(addr.full_name)}<br>
    ${esc(addr.address)}${addr.extra_info ? `, ${esc(addr.extra_info)}` : ''}<br>
    ${esc(addr.commune)}, ${esc(addr.region)}
  </p>`
}

// ─── Order emails ─────────────────────────────────────────────────────────────

/** Customer confirmation + owner alert, sent once when an order becomes paid. */
function orderPaidCustomerHtml(order: OrderWithItems): string {
  const addr = order.shipping_address as ShippingAddress
  return layout('¡Gracias por tu compra!', `
    <p>Hola ${esc(addr.full_name)},</p>
    <p>Recibimos el pago de tu pedido <strong>#${esc(shortId(order))}</strong>. Te avisaremos por correo cuando sea despachado.</p>
    ${orderSummary(order)}
    ${addressBlock(addr)}
    ${button(trackUrl(order), 'Seguir mi pedido')}
    <p style="font-size:12px;color:#7A6E65;text-align:center">Número de orden completo: ${esc(order.id)}</p>
  `)
}

function orderPaidAdminHtml(order: OrderWithItems): string {
  const addr = order.shipping_address as ShippingAddress
  return layout(`Nueva orden #${shortId(order)}`, `
    <p><strong>${esc(addr.full_name)}</strong> · ${esc(addr.email)} · ${esc(addr.phone)}</p>
    ${orderSummary(order)}
    ${addressBlock(addr)}
    ${button(`${appUrl()}/admin/orders/${order.id}`, 'Ver en el panel')}
  `)
}

export async function sendOrderPaidEmails(order: OrderWithItems): Promise<void> {
  const addr = order.shipping_address as ShippingAddress
  const customerHtml = orderPaidCustomerHtml(order)
  const adminHtml    = orderPaidAdminHtml(order)


  await Promise.all([
    sendEmail({
      to:      addr.email,
      subject: `Confirmación de tu pedido #${shortId(order)} · ALSHADAN`,
      html:    customerHtml,
      replyTo: adminEmail(),
    }),
    sendEmail({
      to:      adminEmail(),
      subject: `Nueva orden #${shortId(order)} · ${formatPrice(Number(order.total))}`,
      html:    adminHtml,
      replyTo: addr.email,
    }),
  ])
}

export async function sendOrderShippedEmail(order: Order): Promise<void> {
  const addr = order.shipping_address as ShippingAddress
  const carrierUrl = safeUrl(order.tracking_url)

  const html = layout('Tu pedido va en camino', `
    <p>Hola ${esc(addr.full_name)},</p>
    <p>Tu pedido <strong>#${esc(shortId(order))}</strong> fue despachado.</p>
    ${order.tracking_number ? `<p>Número de seguimiento: <strong>${esc(order.tracking_number)}</strong></p>` : ''}
    ${addressBlock(addr)}
    ${button(carrierUrl ?? trackUrl(order), carrierUrl ? 'Seguir envío' : 'Ver mi pedido')}
  `)

  await sendEmail({
    to:      addr.email,
    subject: `Tu pedido #${shortId(order)} fue despachado · ALSHADAN`,
    html,
    replyTo: adminEmail(),
  })
}

export async function sendOrderCancelledEmail(order: Order): Promise<void> {
  const addr = order.shipping_address as ShippingAddress

  const html = layout('Tu pedido fue cancelado', `
    <p>Hola ${esc(addr.full_name)},</p>
    <p>Tu pedido <strong>#${esc(shortId(order))}</strong> fue cancelado.</p>
    <p>Si ya habías pagado, el reembolso se procesa a través de Mercado Pago. Si tienes dudas, responde a este correo.</p>
  `)

  await sendEmail({
    to:      addr.email,
    subject: `Tu pedido #${shortId(order)} fue cancelado · ALSHADAN`,
    html,
    replyTo: adminEmail(),
  })
}

/** Owner alert for refunds and chargebacks, which need a manual decision. */
export async function sendPaymentReversedAlert(
  orderId: string,
  paymentId: string,
  paymentStatus: string
): Promise<void> {
  const label = paymentStatus === 'charged_back' ? 'Contracargo' : 'Reembolso'
  const html = layout(`${label} en orden #${orderId.slice(0, 8).toUpperCase()}`, `
    <p>Mercado Pago informó un <strong>${esc(label.toLowerCase())}</strong> para el pago ${esc(paymentId)}.</p>
    <p>La orden sigue marcada como pagada. Revisa si corresponde cancelarla o reponer stock.</p>
    ${button(`${appUrl()}/admin/orders/${orderId}`, 'Ver orden')}
  `)

  await sendEmail({
    to:      adminEmail(),
    subject: `${label}: orden #${orderId.slice(0, 8).toUpperCase()}`,
    html,
  })
}

// ─── Contact form ─────────────────────────────────────────────────────────────

export async function sendContactMessage(name: string, email: string, message: string): Promise<boolean> {
  const html = layout('Nuevo mensaje de contacto', `
    <p><strong>${esc(name)}</strong> · ${esc(email)}</p>
    <p style="white-space:pre-wrap;border-left:3px solid #E8DEC8;padding-left:12px">${esc(message)}</p>
    <p style="font-size:12px;color:#7A6E65">Responde a este correo para contestarle directamente.</p>
  `)

  return sendEmail({
    to:      adminEmail(),
    subject: `Mensaje de ${name.replace(/[\r\n]+/g, ' ').slice(0, 60)} · alshadan.com`,
    html,
    replyTo: email,
  })
}

// ─── Admin test ───────────────────────────────────────────────────────────────

/**
 * Sends a sample order confirmation (fake order, real template) so the owner can
 * check delivery, the sender address and how the email looks in their inbox.
 */
export async function sendTestEmail(
  to: string
): Promise<{ customer: SendResult; store: SendResult; storeTo: string }> {
  const now = new Date().toISOString()
  const id = '00000000-0000-4000-8000-000000000000'
  const sample: OrderWithItems = {
    id,
    user_id: null,
    status: 'paid',
    subtotal: 89990,
    discount: 0,
    shipping_cost: 4990,
    total: 94980,
    coupon_code: null,
    shipping_address: {
      full_name: 'Cliente de prueba',
      rut: '11.111.111-1',
      email: to,
      phone: '+56 9 0000 0000',
      address: 'Av. Ejemplo 123',
      commune: 'Providencia',
      region: 'Región Metropolitana',
      country: 'Chile',
    },
    payment_provider: 'mercadopago',
    payment_reference: null,
    tracking_number: null,
    tracking_url: null,
    created_at: now,
    updated_at: now,
    order_items: [{
      id, order_id: id, variant_id: id,
      product_name: 'Perfume de muestra', size_ml: 100, quantity: 1, unit_price: 89990, created_at: now,
    }],
  }

  const bodyCell = '<td style="padding:20px 32px 28px;font-size:14px;line-height:1.6">'
  const markTest = (html: string) => html.replace(
    bodyCell,
    `${bodyCell}<p style="background:#FFF4E5;border:1px solid #F5C99B;border-radius:8px;padding:10px 12px;font-size:12px">Correo de prueba enviado desde el panel de administración. Este pedido no existe.</p>`
  )

  // Same pair of emails a real paid order sends: customer confirmation + store alert
  const storeTo = adminEmail()
  const [customer, store] = await Promise.all([
    deliverEmail({
      to,
      subject: '[Prueba] Confirmación de pedido · ALSHADAN',
      html:    markTest(orderPaidCustomerHtml(sample)),
      replyTo: storeTo,
    }),
    deliverEmail({
      to:      storeTo,
      subject: '[Prueba] Nueva orden · ALSHADAN',
      html:    markTest(orderPaidAdminHtml(sample)),
      replyTo: to,
    }),
  ])
  return { customer, store, storeTo }
}
