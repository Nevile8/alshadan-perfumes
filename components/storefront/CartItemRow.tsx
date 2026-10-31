'use client'

import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { useCartStore, type CartItem } from '@/lib/store/cart'

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCartStore()

  return (
    <div className="flex gap-4 py-4 border-b border-line last:border-0">
      {/* Image */}
      <div className="relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-surface-2">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-line-strong text-2xl">◈</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted uppercase tracking-wider">{item.brand}</p>
        <p className="text-sm font-medium text-ink leading-snug line-clamp-2">{item.productName}</p>
        <p className="text-xs text-muted mt-0.5">{item.size_ml} ml</p>

        {/* Quantity stepper */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
            className="w-7 h-7 rounded-full border border-line text-muted
                       hover:border-accent hover:text-accent transition-colors
                       flex items-center justify-center text-sm font-medium"
          >
            −
          </button>
          <span className="text-sm font-medium text-ink w-4 text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
            className="w-7 h-7 rounded-full border border-line text-muted
                       hover:border-accent hover:text-accent transition-colors
                       flex items-center justify-center text-sm font-medium"
          >
            +
          </button>
        </div>
      </div>

      {/* Price + Remove */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <p className="text-sm font-semibold text-accent">
          {formatPrice(item.price * item.quantity)}
        </p>
        <button
          onClick={() => removeItem(item.variantId)}
          className="text-xs text-muted hover:text-red-500 transition-colors"
          aria-label="Eliminar"
        >
          × Eliminar
        </button>
      </div>
    </div>
  )
}