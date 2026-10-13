'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { CartItemRow } from './CartItemRow'
import { formatPrice } from '@/lib/utils'

export function CartDrawer() {
  const { items, isOpen, closeDrawer, getTotalItems, getTotalPrice } = useCartStore()
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer()
    }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, closeDrawer])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-onyx z-50
                   shadow-2xl flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <div>
            <h2 className="text-lg font-light text-ivory tracking-wide">Tu Carrito</h2>
            <p className="text-xs text-smoke">{totalItems} producto{totalItems !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 rounded-full border border-line text-smoke
                       hover:border-gold hover:text-ivory transition-colors
                       flex items-center justify-center"
            aria-label="Cerrar carrito"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
              <div className="w-16 h-16 rounded-full bg-onyx-raised flex items-center justify-center">
                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <div>
                <p className="text-ivory font-medium mb-1">Tu carrito esta vacio</p>
                <p className="text-sm text-smoke">Agrega tus fragancias favoritas</p>
              </div>
              <button
                onClick={closeDrawer}
                className="mt-2 px-6 py-2.5 bg-gold text-onyx text-xs font-medium
                           tracking-widest uppercase rounded-full hover:bg-gold-deep transition-colors"
              >
                Explorar Perfumes
              </button>
            </div>
          ) : (
            <div className="py-2">
              {items.map((item) => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-line bg-onyx-card space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-smoke">Subtotal</span>
              <span className="text-base font-semibold text-ivory">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <p className="text-xs text-smoke">
              Envio y descuentos calculados al finalizar la compra.
            </p>

            {/* CTA */}
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="block w-full py-4 bg-gold text-onyx text-sm font-semibold
                         tracking-widest uppercase rounded-xl text-center
                         hover:bg-gold-deep transition-colors"
            >
              Finalizar Compra
            </Link>

            {/* Secondary */}
            <button
              onClick={closeDrawer}
              className="block w-full py-2.5 text-xs text-smoke hover:text-ivory
                         tracking-wider uppercase transition-colors"
            >
              Seguir Comprando →
            </button>
          </div>
        )}
      </div>
    </>
  )
}