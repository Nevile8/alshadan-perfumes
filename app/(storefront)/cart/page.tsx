'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { CartItemRow } from '@/components/storefront/CartItemRow'
import { formatPrice } from '@/lib/utils'
import { validateCoupon } from '@/app/(storefront)/checkout/actions'
import type { Coupon } from '@/lib/types/database'
import { LIMITS } from '@/lib/limits'

/** Same rule as checkout: never discount the whole order. */
function couponDiscount(coupon: Coupon | null, subtotal: number): number {
  if (!coupon) return 0
  const raw = coupon.discount_type === 'percentage'
    ? Math.round(subtotal * Number(coupon.discount_value) / 100)
    : Number(coupon.discount_value)
  return Math.max(0, Math.min(raw, subtotal - 1))
}

export default function CartPage() {
  const { items, clearCart, getTotalItems, getTotalPrice, couponCode: storedCode, setCouponCode } = useCartStore()

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  const [codeInput,     setCodeInput]     = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError,   setCouponError]   = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  // Re-check a code saved earlier whenever the cart total changes
  useEffect(() => {
    if (!storedCode || totalPrice === 0) return
    let cancelled = false
    validateCoupon(storedCode, totalPrice).then((result) => {
      if (cancelled) return
      setAppliedCoupon(result.coupon)
      setCouponError(result.error)
      if (result.coupon) setCodeInput(result.coupon.code)
    })
    return () => { cancelled = true }
  }, [storedCode, totalPrice])

  async function handleApplyCoupon() {
    const code = codeInput.trim()
    if (!code) return
    setCouponLoading(true)
    setCouponError(null)
    const result = await validateCoupon(code, totalPrice)
    setCouponLoading(false)
    if (result.error || !result.coupon) {
      setCouponError(result.error)
      setAppliedCoupon(null)
      setCouponCode(null)
      return
    }
    setAppliedCoupon(result.coupon)
    setCouponCode(result.coupon.code)
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setCouponError(null)
    setCodeInput('')
    setCouponCode(null)
  }

  const discount = couponDiscount(appliedCoupon, totalPrice)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-ink tracking-wide">Carrito de Compras</h1>
          <p className="text-sm text-muted mt-1">{totalItems} producto{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/"
          className="text-sm text-muted hover:text-accent transition-colors flex items-center gap-1"
        >
          ← Volver a la tienda
        </Link>
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-5">
            <svg className="w-9 h-9 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h2 className="text-lg font-medium text-ink mb-2">Tu carrito esta vacio</h2>
          <p className="text-sm text-muted mb-8">Explora nuestra coleccion de perfumes de lujo.</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-accent text-page text-sm font-medium
                       tracking-widest uppercase rounded-full hover:bg-accent-deep transition-colors"
          >
            Explorar Perfumes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items list */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-line rounded-2xl px-6">
              {items.map((item) => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
            </div>

            <button
              onClick={clearCart}
              className="mt-4 text-xs text-muted hover:text-red-500 transition-colors underline underline-offset-2"
            >
              Vaciar carrito
            </button>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="bg-surface border border-line rounded-2xl p-6 space-y-4 sticky top-24">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
                Resumen del Pedido
              </h2>

              {/* Coupon: validated here, carried to checkout through the cart store */}
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => { setCodeInput(e.target.value); setCouponError(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon() }}
                    placeholder="Codigo de cupon"
                    maxLength={LIMITS.couponCode}
                    disabled={!!appliedCoupon}
                    className="flex-1 min-w-0 px-3 py-2 text-sm bg-surface-2 border border-line rounded-lg uppercase
                               text-ink placeholder-muted placeholder:normal-case focus:outline-none focus:border-accent transition-colors
                               disabled:opacity-70"
                  />
                  {appliedCoupon ? (
                    <button type="button" onClick={handleRemoveCoupon}
                            className="px-4 py-2 text-xs font-medium text-muted border border-line
                                       rounded-lg hover:text-red-500 hover:border-red-300 transition-colors">
                      Quitar
                    </button>
                  ) : (
                    <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !codeInput.trim()}
                            className="px-4 py-2 text-xs font-medium text-accent border border-accent
                                       rounded-lg hover:bg-accent hover:text-page transition-colors
                                       disabled:opacity-40 disabled:cursor-not-allowed">
                      {couponLoading ? '...' : 'Aplicar'}
                    </button>
                  )}
                </div>
                {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-green-600 text-xs mt-1">✓ Cupón {appliedCoupon.code} aplicado</p>
                )}
              </div>

              <div className="border-t border-line pt-4 space-y-2">
                <div className="flex justify-between text-sm text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento</span>
                    <span>− {formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-muted">
                  <span>Envio</span>
                  <span className="text-green-600">Calculado al pagar</span>
                </div>
              </div>

              <div className="border-t border-line pt-4 flex justify-between font-semibold text-ink">
                <span>Total</span>
                <span>{formatPrice(totalPrice - discount)}</span>
              </div>

              <Link
                href="/checkout"
                className="block w-full py-4 bg-accent text-page text-sm font-semibold
                           tracking-widest uppercase rounded-xl text-center
                           hover:bg-accent-deep transition-colors"
              >
                Finalizar Compra
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}