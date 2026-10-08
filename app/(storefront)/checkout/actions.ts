'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateShipping } from '@/lib/utils'
import type { CartItem } from '@/lib/store/cart'
import type { Commune, Coupon, StoreSetting } from '@/lib/types/database'

// ─── Fetch shipping data for checkout page ────────────────────────────────────

export async function getShippingData(): Promise<{
  communes: Commune[]
  surchargePercent: number
}> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [{ data: communesData }, { data: settingsData }] = await Promise.all([
    sb.from('communes').select('*').eq('is_active', true).order('region_code').order('commune_name'),
    sb.from('store_settings').select('*').eq('key', 'extra_item_surcharge_percent').single(),
  ])

  return {
    communes:         (communesData ?? []) as Commune[],
    surchargePercent: Number((settingsData as StoreSetting | null)?.value ?? 15),
  }
}

// ─── Validate coupon ──────────────────────────────────────────────────────────

/** Escape LIKE wildcards so a code like "%" can't match every coupon. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<{ coupon: Coupon | null; error: string | null }> {
  const trimmed = typeof code === 'string' ? code.trim() : ''
  if (!trimmed || trimmed.length > 50) return { coupon: null, error: 'Cupón no encontrado o inactivo.' }

  // Coupons are not publicly readable (RLS), so look them up server-side.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (createAdminClient() as any)
    .from('coupons')
    .select('*')
    .ilike('code', escapeLike(trimmed))
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return { coupon: null, error: 'Cupón no encontrado o inactivo.' }

  const coupon = data as Coupon

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { coupon: null, error: 'Este cupón ha expirado.' }
  }
  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
    return { coupon: null, error: 'Este cupón ya alcanzó su límite de usos.' }
  }
  if (coupon.min_purchase !== null && subtotal < coupon.min_purchase) {
    return { coupon: null, error: `Compra mínima requerida: $${Number(coupon.min_purchase).toLocaleString('es-CL')}.` }
  }

  return { coupon, error: null }
}

// ─── Process checkout ─────────────────────────────────────────────────────────

export interface CheckoutFormData {
  full_name:      string
  rut:            string
  email:          string
  phone:          string
  commune_id:     string
  address:        string
  extra_info:     string
  payment_method: 'mercadopago' | 'webpay'
  coupon_code:    string
}

const MAX_QUANTITY_PER_ITEM = 20
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length <= max ? trimmed : null
}

/** Server Actions are public endpoints: never trust the shape of the input. */
function validateForm(form: CheckoutFormData): { data: CheckoutFormData | null; error: string | null } {
  if (!form || typeof form !== 'object') return { data: null, error: 'Datos inválidos.' }

  const data = {
    full_name:      str(form.full_name, 120),
    rut:            str(form.rut, 20),
    email:          str(form.email, 254)?.toLowerCase() ?? null,
    phone:          str(form.phone, 30),
    commune_id:     str(form.commune_id, 10),
    address:        str(form.address, 200),
    extra_info:     str(form.extra_info ?? '', 300),
    payment_method: form.payment_method,
    coupon_code:    str(form.coupon_code ?? '', 50),
  }

  if (!data.full_name || !data.rut || !data.phone || !data.commune_id || !data.address)
    return { data: null, error: 'Completa todos los campos obligatorios.' }
  if (!data.email || !EMAIL_RE.test(data.email))
    return { data: null, error: 'Ingresa un correo válido.' }
  if (data.extra_info === null || data.coupon_code === null)
    return { data: null, error: 'Datos inválidos.' }
  if (data.payment_method !== 'mercadopago')
    return { data: null, error: 'Por ahora solo aceptamos pagos con Mercado Pago.' }

  return { data: data as CheckoutFormData, error: null }
}

/** Merge duplicate lines and keep only whole quantities between 1 and the max. */
function normalizeCart(cartItems: CartItem[]): { lines: { variantId: string; quantity: number }[] | null; error: string | null } {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return { lines: null, error: 'El carrito está vacío.' }

  const quantities = new Map<string, number>()
  for (const item of cartItems) {
    const qty = item?.quantity
    if (typeof item?.variantId !== 'string' || !Number.isInteger(qty) || qty < 1)
      return { lines: null, error: 'Carrito inválido.' }
    quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + qty)
  }

  for (const qty of quantities.values()) {
    if (qty > MAX_QUANTITY_PER_ITEM)
      return { lines: null, error: `Máximo ${MAX_QUANTITY_PER_ITEM} unidades por producto.` }
  }

  return {
    lines: [...quantities].map(([variantId, quantity]) => ({ variantId, quantity })),
    error: null,
  }
}

function getAppUrl(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) return appUrl.replace(/\/$/, '')
  return process.env.NODE_ENV === 'production' ? null : 'http://localhost:3000'
}

type DbVariant = {
  id: string
  price: number
  stock: number
  size_ml: number
  products: { name: string; is_active: boolean } | null
}

export async function processCheckout(
  cartItems: CartItem[],
  rawForm: CheckoutFormData
): Promise<{ error: string | null; redirectUrl?: string }> {
  const { lines, error: cartError } = normalizeCart(cartItems)
  if (!lines) return { error: cartError }

  const { data: form, error: formError } = validateForm(rawForm)
  if (!form) return { error: formError }

  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  const appUrl  = getAppUrl()
  if (!mpToken || !appUrl) {
    console.error('[Checkout] MERCADOPAGO_ACCESS_TOKEN or NEXT_PUBLIC_APP_URL is not configured')
    return { error: 'El pago no está disponible en este momento. Intenta más tarde.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminSupabase = createAdminClient() as any
  const userSupabase  = await createClient()

  // ── 1. Get auth user (may be null for guests) ──────────────────────────────
  const { data: { user } } = await userSupabase.auth.getUser()

  // ── 2. Validate stock & fetch variants (prices always come from the DB) ───
  const { data: variantsData, error: variantsError } = await adminSupabase
    .from('product_variants')
    .select('id, price, stock, size_ml, products!inner(name, is_active)')
    .in('id', lines.map((l) => l.variantId))

  if (variantsError) {
    console.error('[Checkout] variants', variantsError)
    return { error: 'Error al verificar stock.' }
  }

  const variants = new Map((variantsData as DbVariant[]).map((v) => [v.id, v]))

  for (const line of lines) {
    const dbVariant = variants.get(line.variantId)
    if (!dbVariant || !dbVariant.products?.is_active)
      return { error: 'Uno de los productos del carrito ya no está disponible.' }
    if (dbVariant.stock < line.quantity)
      return { error: `Stock insuficiente para ${dbVariant.products.name} (${dbVariant.size_ml}ml).` }
  }

  // ── 3. Get commune price ───────────────────────────────────────────────────
  const { data: commune, error: communeError } = await adminSupabase
    .from('communes')
    .select('*')
    .eq('id', form.commune_id)
    .eq('is_active', true)
    .single()

  if (communeError || !commune) return { error: 'Comuna no válida.' }

  const { data: setting } = await adminSupabase
    .from('store_settings')
    .select('value')
    .eq('key', 'extra_item_surcharge_percent')
    .single()

  const surchargePercent = Number(setting?.value ?? 15)
  const totalItems = lines.reduce((s, l) => s + l.quantity, 0)
  const shippingCost = calculateShipping(commune.base_price, surchargePercent, totalItems)

  // ── 4. Compute subtotal (server-side, no client spoofing) ─────────────────
  const subtotal = lines.reduce(
    (sum, line) => sum + Number(variants.get(line.variantId)!.price) * line.quantity,
    0
  )

  // ── 5. Apply coupon (usage is counted by the webhook once paid) ───────────
  let discount = 0
  if (form.coupon_code) {
    const { coupon, error: couponError } = await validateCoupon(form.coupon_code, subtotal)
    if (couponError) return { error: couponError }
    if (coupon) {
      discount = coupon.discount_type === 'percentage'
        ? Math.round(subtotal * Number(coupon.discount_value) / 100)
        : Number(coupon.discount_value)
      // Never discount more than the products themselves
      discount = Math.min(discount, subtotal - 1)
    }
  }

  const total = subtotal - discount + shippingCost

  // ── 6. Create order ────────────────────────────────────────────────────────
  const shippingAddress = {
    full_name:  form.full_name,
    rut:        form.rut,
    email:      form.email,
    phone:      form.phone,
    address:    form.address,
    commune:    commune.commune_name,
    region:     commune.region_name,
    country:    'Chile',
    extra_info: form.extra_info,
  }

  const { data: order, error: orderError } = await adminSupabase
    .from('orders')
    .insert({
      user_id:          user?.id ?? null,
      status:           'pending',
      subtotal,
      discount,
      shipping_cost:    shippingCost,
      total,
      coupon_code:      form.coupon_code || null,
      shipping_address: shippingAddress,
      payment_provider: form.payment_method,
      payment_reference: null,
    })
    .select('id')
    .single()

  if (orderError) {
    console.error('[Checkout] order insert', orderError)
    return { error: 'No pudimos crear tu orden. Intenta nuevamente.' }
  }

  // Remove the order (items cascade) if a later step fails, so no orphan pending orders remain
  const abort = async (message: string, detail: unknown) => {
    console.error(`[Checkout] ${message}`, detail)
    await adminSupabase.from('orders').delete().eq('id', order.id)
    return { error: 'No pudimos procesar tu pago. Intenta nuevamente.' }
  }

  // ── 7. Create order items ──────────────────────────────────────────────────
  const orderItems = lines.map((line) => {
    const dbVariant = variants.get(line.variantId)!
    return {
      order_id:     order.id,
      variant_id:   line.variantId,
      product_name: dbVariant.products!.name,
      size_ml:      dbVariant.size_ml,
      quantity:     line.quantity,
      unit_price:   Number(dbVariant.price),
    }
  })

  const { error: itemsError } = await adminSupabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) return abort('order_items insert', itemsError)

  // ── 8. Mercado Pago preference ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mpItems: any[] = orderItems.map((item) => ({
    id: item.variant_id,
    title: `${item.product_name} - ${item.size_ml}ml`,
    quantity: item.quantity,
    unit_price: item.unit_price,
    currency_id: 'CLP',
  }))

  // Cart-level discounts are sent as a single aggregated line so MP's totals match
  if (discount > 0) {
    mpItems = [{
      id: `ORDER_${order.id.split('-')[0]}`,
      title: `Orden ALSHADAN #${order.id.slice(0, 8).toUpperCase()}`,
      quantity: 1,
      unit_price: subtotal - discount,
      currency_id: 'CLP',
    }]
  }

  const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    items: mpItems,
    external_reference: order.id,
    back_urls: {
      success: `${appUrl}/checkout/status`,
      pending: `${appUrl}/checkout/status`,
      failure: `${appUrl}/checkout/status`,
    },
    payer: {
      name: form.full_name,
      email: form.email,
    },
  }

  if (isLocalhost) {
    // auto_return and shipments need a public URL — charge shipping as an item instead
    if (shippingCost > 0) {
      payload.items.push({ id: 'SHIPPING', title: 'Envío', quantity: 1, unit_price: shippingCost, currency_id: 'CLP' })
    }
  } else {
    payload.auto_return = 'approved'
    payload.shipments   = { cost: shippingCost, mode: 'not_specified' }
  }

  try {
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpToken}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) return abort('MP preference error', await res.text())

    const prefResult = await res.json()
    if (!prefResult.init_point) return abort('MP preference without init_point', prefResult)

    return { error: null, redirectUrl: prefResult.init_point }
  } catch (err) {
    return abort('MP preference request failed', err)
  }
}
