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

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<{ coupon: Coupon | null; error: string | null }> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('coupons')
    .select('*')
    .ilike('code', code.trim())
    .eq('is_active', true)
    .single()

  if (error || !data) return { coupon: null, error: 'Cupón no encontrado o inactivo.' }

  const coupon = data as Coupon

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { coupon: null, error: 'Este cupón ha expirado.' }
  }
  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
    return { coupon: null, error: 'Este cupón ya alcanzó su límite de usos.' }
  }
  if (coupon.min_purchase !== null && subtotal < coupon.min_purchase) {
    return { coupon: null, error: `Compra mínima requerida: $${coupon.min_purchase.toLocaleString('es-CL')}.` }
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

export async function processCheckout(
  cartItems: CartItem[],
  form: CheckoutFormData
): Promise<{ error: string | null; redirectUrl?: string }> {
  if (cartItems.length === 0) return { error: 'El carrito está vacío.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminSupabase = createAdminClient() as any
  const userSupabase  = await createClient()

  // ── 1. Get auth user (may be null for guests) ──────────────────────────────
  const { data: { user } } = await userSupabase.auth.getUser()

  // ── 2. Validate stock & fetch variants ────────────────────────────────────
  const variantIds = cartItems.map((i) => i.variantId)
  const { data: variants, error: variantsError } = await adminSupabase
    .from('product_variants')
    .select('id, price, stock, size_ml')
    .in('id', variantIds)

  if (variantsError) return { error: 'Error al verificar stock.' }

  for (const cartItem of cartItems) {
    const dbVariant = (variants as Array<{ id: string; price: number; stock: number; size_ml: number }>)
      .find((v) => v.id === cartItem.variantId)
    if (!dbVariant) return { error: `Variante no encontrada: ${cartItem.productName}.` }
    if (dbVariant.stock < cartItem.quantity)
      return { error: `Stock insuficiente para ${cartItem.productName} (${cartItem.size_ml}ml).` }
  }

  // ── 3. Get commune price ───────────────────────────────────────────────────
  const { data: commune, error: communeError } = await adminSupabase
    .from('communes')
    .select('*')
    .eq('id', form.commune_id)
    .single()

  if (communeError || !commune) return { error: 'Comuna no válida.' }

  const { data: setting } = await adminSupabase
    .from('store_settings')
    .select('value')
    .eq('key', 'extra_item_surcharge_percent')
    .single()

  const surchargePercent = Number(setting?.value ?? 15)
  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0)
  const shippingCost = calculateShipping(commune.base_price, surchargePercent, totalItems)

  // ── 4. Compute subtotal (server-side, no client spoofing) ─────────────────
  const subtotal = cartItems.reduce((sum, item) => {
    const dbVariant = (variants as Array<{ id: string; price: number }>)
      .find((v) => v.id === item.variantId)!
    return sum + dbVariant.price * item.quantity
  }, 0)

  // ── 5. Apply coupon ────────────────────────────────────────────────────────
  let discount = 0
  if (form.coupon_code.trim()) {
    const { coupon, error: couponError } = await validateCoupon(form.coupon_code, subtotal)
    if (couponError) return { error: couponError }
    if (coupon) {
      discount = coupon.discount_type === 'percentage'
        ? Math.round(subtotal * coupon.discount_value / 100)
        : coupon.discount_value
      // Increment coupon usage
      await adminSupabase
        .from('coupons')
        .update({ current_uses: coupon.current_uses + 1 })
        .eq('id', coupon.id)
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
      coupon_code:      form.coupon_code.trim() || null,
      shipping_address: shippingAddress,
      payment_provider: form.payment_method,
      payment_reference: null,
    })
    .select('id')
    .single()

  if (orderError) return { error: `Error al crear la orden: ${orderError.message}` }

  // ── 7. Create order items ──────────────────────────────────────────────────
  const orderItems = cartItems.map((item) => {
    const dbVariant = (variants as Array<{ id: string; price: number; size_ml: number }>)
      .find((v) => v.id === item.variantId)!
    return {
      order_id:     order.id,
      variant_id:   item.variantId,
      product_name: item.productName,
      size_ml:      dbVariant.size_ml,
      quantity:     item.quantity,
      unit_price:   dbVariant.price,
    }
  })

  const { error: itemsError } = await adminSupabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) return { error: `Error al crear items: ${itemsError.message}` }

  // ── 8. Payment gateway ────────────────────────────────────────────────────
  if (form.payment_method === 'mercadopago') {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!mpToken) return { error: 'Mercado Pago no está configurado.' }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mpItems: any[] = orderItems.map((item) => ({
      id: item.variant_id,
      title: `${item.product_name} - ${item.size_ml}ml`,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: 'CLP',
    }))

    // If there is a discount, MP strict math might fail if we don't apply it per item.
    // Easiest robust approach for cart-level discounts is aggregating to a single item line:
    if (discount > 0) {
      mpItems = [{
        id: `ORDER_${order.id.split('-')[0]}`,
        title: `Orden ALSHADAN #${order.id.slice(0, 8).toUpperCase()}`,
        quantity: 1,
        unit_price: subtotal - discount,
        currency_id: 'CLP',
      }]
    }

    try {
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

      // auto_return requires a publicly accessible URL — disabled on localhost
      if (!isLocalhost) {
        payload.auto_return = 'approved'
        payload.shipments   = { cost: shippingCost, mode: 'not_specified' }
      }

      const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mpToken}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('[MP Fetch Error]', errText)
        return { error: `Error Mercado Pago: ${errText}. Verifica tu Access Token o payload.` }
      }

      const prefResult = await res.json()

      if (prefResult.init_point) {
        return { error: null, redirectUrl: prefResult.init_point }
      }
    } catch (err: any) {
      console.error('[MP Pref Error]', err)
      return { error: `Error Mercado Pago: ${err.message || 'Token inválido o error de conexión'}. Verifica tu Access Token en .env.local` }
    }
  }

  // Fallback for Webpay (Phase 7) or if MP fails to return init_point
  return { error: null, redirectUrl: `/checkout/pending?order=${order.id}` }
}