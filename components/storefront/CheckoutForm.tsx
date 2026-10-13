'use client'

import { useEffect, useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/store/cart'
import { processCheckout, validateCoupon } from '@/app/(storefront)/checkout/actions'
import { formatPrice, calculateShipping } from '@/lib/utils'
import type { Commune, Coupon } from '@/lib/types/database'

interface CheckoutFormProps {
  communes:         Commune[]
  surchargePercent: number
}

// Group communes by region for the dropdowns
function groupByRegion(communes: Commune[]): Record<string, Commune[]> {
  return communes.reduce<Record<string, Commune[]>>((acc, c) => {
    if (!acc[c.region_name]) acc[c.region_name] = []
    acc[c.region_name].push(c)
    return acc
  }, {})
}

const inputClass = `w-full px-4 py-3 text-sm bg-onyx-card border border-line rounded-xl
                    text-ivory placeholder-smoke focus:outline-none focus:border-gold
                    transition-colors`
const labelClass = 'block text-xs text-smoke uppercase tracking-wider mb-1.5'

export function CheckoutForm({ communes, surchargePercent }: CheckoutFormProps) {
  const { items, getTotalPrice, getTotalItems, couponCode: storedCode, setCouponCode: setStoredCode } = useCartStore()
  const [isPending, startTransition] = useTransition()

  // Form fields
  const [fullName,   setFullName]   = useState('')
  const [rut,        setRut]        = useState('')
  const [email,      setEmail]      = useState('')
  const [phone,      setPhone]      = useState('')
  const [address,    setAddress]    = useState('')
  const [extraInfo,  setExtraInfo]  = useState('')
  const [selectedRegion,  setSelectedRegion]  = useState('')
  const [selectedCommune, setSelectedCommune] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'webpay'>('mercadopago')

  // Coupon
  const [couponCode,    setCouponCode]    = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError,   setCouponError]   = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const [formError, setFormError] = useState<string | null>(null)

  const byRegion = useMemo(() => groupByRegion(communes), [communes])
  const regionNames = Object.keys(byRegion).sort()
  const communesForRegion = selectedRegion ? (byRegion[selectedRegion] ?? []) : []

  // Compute shipping from selected commune
  const selectedCommuneObj = communes.find((c) => c.id === selectedCommune) ?? null
  const subtotal   = getTotalPrice()
  const totalItems = getTotalItems()
  const shippingCost = selectedCommuneObj
    ? calculateShipping(selectedCommuneObj.base_price, surchargePercent, totalItems)
    : null

  // Coupon discount
  // Same rule as the server: never discount more than the products themselves
  const rawDiscount = appliedCoupon
    ? appliedCoupon.discount_type === 'percentage'
      ? Math.round(subtotal * Number(appliedCoupon.discount_value) / 100)
      : Number(appliedCoupon.discount_value)
    : 0
  const discount = Math.max(0, Math.min(rawDiscount, subtotal - 1))

  const total = subtotal - discount + (shippingCost ?? 0)

  // Apply a coupon already accepted in the cart (re-validated against this subtotal)
  useEffect(() => {
    if (!storedCode || subtotal === 0) return
    let cancelled = false
    validateCoupon(storedCode, subtotal).then((result) => {
      if (cancelled) return
      setCouponCode(storedCode)
      setAppliedCoupon(result.coupon)
      setCouponError(result.error)
    })
    return () => { cancelled = true }
  }, [storedCode, subtotal])

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError(null)
    const result = await validateCoupon(couponCode, subtotal)
    if (result.error) {
      setCouponError(result.error)
      setAppliedCoupon(null)
      setStoredCode(null)
    } else {
      setAppliedCoupon(result.coupon)
      setStoredCode(result.coupon?.code ?? null)
    }
    setCouponLoading(false)
  }

  function handleRegionChange(region: string) {
    setSelectedRegion(region)
    setSelectedCommune('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCommune) { setFormError('Selecciona una comuna de destino.'); return }
    if (items.length === 0) { setFormError('Tu carrito está vacío.'); return }
    setFormError(null)

    startTransition(async () => {
      const result = await processCheckout(items, {
        full_name:      fullName,
        rut,
        email,
        phone,
        address,
        extra_info:     extraInfo,
        commune_id:     selectedCommune,
        payment_method: paymentMethod,
        coupon_code:    appliedCoupon?.code ?? '',
      })
      if (result?.error) {
        setFormError(result.error)
      } else if (result?.redirectUrl) {
        window.location.href = result.redirectUrl
      }
    })
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-smoke mb-4">Tu carrito está vacío.</p>
        <Link href="/" className="text-gold hover:underline text-sm">← Volver a la tienda</Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Left: Form ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Contact */}
          <section className="bg-onyx-card border border-line rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ivory uppercase tracking-wider">
              Información de Contacto
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Nombre completo</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  required placeholder="Juan Pérez" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>RUT</label>
                <input type="text" value={rut} onChange={(e) => setRut(e.target.value)}
                  required placeholder="12.345.678-9" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  required placeholder="+56 9 XXXX XXXX" className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Correo electrónico</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="juan@correo.com" className={inputClass} />
              </div>
            </div>
          </section>

          {/* Shipping address */}
          <section className="bg-onyx-card border border-line rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ivory uppercase tracking-wider">
              Dirección de Envío
            </h2>
            <p className="text-xs text-smoke">Solo realizamos envíos dentro de Chile.</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Region */}
              <div>
                <label className={labelClass}>Región</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">Selecciona una región</option>
                  {regionNames.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Commune */}
              <div>
                <label className={labelClass}>Comuna</label>
                <select
                  value={selectedCommune}
                  onChange={(e) => setSelectedCommune(e.target.value)}
                  required
                  disabled={!selectedRegion}
                  className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">Selecciona una comuna</option>
                  {communesForRegion.map((c) => (
                    <option key={c.id} value={c.id}>{c.commune_name}</option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div className="col-span-2">
                <label className={labelClass}>Dirección</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  required placeholder="Av. Providencia 1234, Depto 5B" className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Información adicional (opcional)</label>
                <input type="text" value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)}
                  placeholder="Código de acceso, referencia, etc." className={inputClass} />
              </div>
            </div>
          </section>

          {/* Payment method */}
          <section className="bg-onyx-card border border-line rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ivory uppercase tracking-wider">
              Método de Pago
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Webpay is not integrated yet — add 'webpay' back here once it is */}
              {(['mercadopago'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === method
                      ? 'border-gold bg-gold/10'
                      : 'border-line hover:border-gold/50'
                  }`}
                >
                  <p className={`text-sm font-semibold capitalize ${
                    paymentMethod === method ? 'text-gold' : 'text-ivory'
                  }`}>
                    {method === 'mercadopago' ? 'Mercado Pago' : 'Webpay'}
                  </p>
                  <p className="text-xs text-smoke mt-0.5">
                    {method === 'mercadopago'
                      ? 'Tarjeta, débito, efectivo'
                      : 'Tarjeta de débito o crédito'}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ── Right: Order Summary ─────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-onyx-card border border-line rounded-2xl p-6 space-y-5 sticky top-24">
            <h2 className="text-sm font-semibold text-ivory uppercase tracking-wider">
              Resumen del Pedido
            </h2>

            {/* Items */}
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.variantId} className="flex items-center gap-3">
                  <div className="relative w-10 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-onyx-raised">
                    {item.imageUrl
                      ? <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="40px" />
                      : <div className="w-full h-full flex items-center justify-center text-line-strong text-lg">◈</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ivory font-medium line-clamp-1">{item.productName}</p>
                    <p className="text-[10px] text-smoke">{item.size_ml}ml × {item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold text-gold flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-line pt-4">
              <label className={labelClass}>Código de cupón</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); setAppliedCoupon(null); setCouponError(null); setStoredCode(null) }}
                  placeholder="DESCUENTO10"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-3 text-xs font-medium text-gold border border-gold
                             rounded-xl hover:bg-gold hover:text-onyx transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {couponLoading ? '...' : 'Aplicar'}
                </button>
              </div>
              {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-green-400 text-xs mt-1">
                  ✓ Cupón aplicado — {appliedCoupon.discount_type === 'percentage'
                    ? `${appliedCoupon.discount_value}% de descuento`
                    : `${formatPrice(appliedCoupon.discount_value)} de descuento`}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-line pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-smoke">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Descuento</span>
                  <span>− {formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-smoke">
                <span>Envío {selectedCommuneObj ? `(${selectedCommuneObj.commune_name})` : ''}</span>
                <span>
                  {shippingCost !== null
                    ? formatPrice(shippingCost)
                    : <span className="italic text-xs">Selecciona una comuna</span>}
                </span>
              </div>
              {selectedCommuneObj && totalItems > 1 && (
                <p className="text-[10px] text-smoke">
                  Base {formatPrice(selectedCommuneObj.base_price)} + {surchargePercent}% por {totalItems - 1} perfume{totalItems > 2 ? 's' : ''} adicional{totalItems > 2 ? 'es' : ''}
                </p>
              )}
            </div>

            <div className="border-t border-line pt-4 flex justify-between font-semibold text-ivory">
              <span>Total</span>
              <span className="text-gold">{formatPrice(total)}</span>
            </div>

            {formError && (
              <p className="text-red-500 text-xs py-2 px-3 bg-red-950/40 border border-red-800/60 rounded-lg">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending || !selectedCommune}
              className="w-full py-4 bg-gold text-onyx text-sm font-semibold tracking-widest
                         uppercase rounded-xl hover:bg-gold-deep transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Procesando...' : `Pagar con ${paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Webpay'}`}
            </button>

            <p className="text-[10px] text-smoke text-center">
              Al continuar aceptas nuestros Términos y Condiciones.
            </p>
          </div>
        </div>
      </div>
    </form>
  )
}