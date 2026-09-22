'use client'

import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import { CartItemRow } from '@/components/storefront/CartItemRow'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const { items, clearCart, getTotalItems, getTotalPrice } = useCartStore()

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-[#2C221E] tracking-wide">Carrito de Compras</h1>
          <p className="text-sm text-[#7A6E65] mt-1">{totalItems} producto{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/"
          className="text-sm text-[#7A6E65] hover:text-[#D4A054] transition-colors flex items-center gap-1"
        >
          ← Volver a la tienda
        </Link>
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-[#F0E8D8] flex items-center justify-center mx-auto mb-5">
            <svg className="w-9 h-9 text-[#D4A054]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h2 className="text-lg font-medium text-[#2C221E] mb-2">Tu carrito esta vacio</h2>
          <p className="text-sm text-[#7A6E65] mb-8">Explora nuestra coleccion de perfumes de lujo.</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-[#E86A33] text-white text-sm font-medium
                       tracking-widest uppercase rounded-full hover:bg-[#d05a28] transition-colors"
          >
            Explorar Perfumes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items list */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-[#E8DEC8] rounded-2xl px-6">
              {items.map((item) => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
            </div>

            <button
              onClick={clearCart}
              className="mt-4 text-xs text-[#7A6E65] hover:text-red-500 transition-colors underline underline-offset-2"
            >
              Vaciar carrito
            </button>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 space-y-4 sticky top-24">
              <h2 className="text-sm font-semibold text-[#2C221E] uppercase tracking-wider">
                Resumen del Pedido
              </h2>

              {/* Coupon — wired in Phase 5 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Codigo de cupon"
                  className="flex-1 px-3 py-2 text-sm bg-[#FDF9F3] border border-[#E8DEC8] rounded-lg
                             text-[#2C221E] placeholder-[#7A6E65] focus:outline-none focus:border-[#D4A054] transition-colors"
                />
                <button className="px-4 py-2 text-xs font-medium text-[#D4A054] border border-[#D4A054]
                                   rounded-lg hover:bg-[#D4A054] hover:text-white transition-colors">
                  Aplicar
                </button>
              </div>

              <div className="border-t border-[#E8DEC8] pt-4 space-y-2">
                <div className="flex justify-between text-sm text-[#7A6E65]">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#7A6E65]">
                  <span>Envio</span>
                  <span className="text-green-600">Calculado al pagar</span>
                </div>
              </div>

              <div className="border-t border-[#E8DEC8] pt-4 flex justify-between font-semibold text-[#2C221E]">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>

              <Link
                href="/checkout"
                className="block w-full py-4 bg-[#E86A33] text-white text-sm font-semibold
                           tracking-widest uppercase rounded-xl text-center
                           hover:bg-[#d05a28] transition-colors"
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