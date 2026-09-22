'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { formatPrice } from '@/lib/utils'
import type { Product, ProductVariant } from '@/lib/types/database'

interface AddToCartButtonProps {
  product:  Product
  variant:  ProductVariant | null
}

export function AddToCartButton({ product, variant }: AddToCartButtonProps) {
  const { addItem, openDrawer } = useCartStore()
  const [added, setAdded] = useState(false)

  function handleAddToCart() {
    if (!variant || variant.stock === 0) return

    addItem({
      variantId:   variant.id,
      productId:   product.id,
      productName: product.name,
      brand:       product.brand,
      slug:        product.slug,
      imageUrl:    product.image_url,
      size_ml:     variant.size_ml,
      price:       variant.price,
    })

    openDrawer()

    // Brief confirmation state
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const isDisabled = !variant || variant.stock === 0

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={`w-full py-4 rounded-xl text-sm font-semibold tracking-widest uppercase transition-all
        ${added
          ? 'bg-green-600 text-white'
          : isDisabled
            ? 'bg-[#E8DEC8] text-[#7A6E65] cursor-not-allowed'
            : 'bg-[#E86A33] text-white hover:bg-[#d05a28] active:scale-[0.98]'}`}
    >
      {added
        ? '✓ Agregado al Carrito'
        : isDisabled
          ? 'Agotado'
          : variant
            ? `Agregar — ${formatPrice(variant.price)}`
            : 'Selecciona un tamano'}
    </button>
  )
}