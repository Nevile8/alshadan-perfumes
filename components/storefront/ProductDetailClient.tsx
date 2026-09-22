'use client'

import { useState } from 'react'
import { VariantSelector } from './VariantSelector'
import { AddToCartButton } from './AddToCartButton'
import type { Product, ProductVariant } from '@/lib/types/database'

interface ProductDetailClientProps {
  product:  Product
  variants: ProductVariant[]
}

export function ProductDetailClient({ product, variants }: ProductDetailClientProps) {
  const sorted = [...variants].sort((a, b) => a.size_ml - b.size_ml)
  const firstInStock = sorted.find((v) => v.stock > 0) ?? sorted[0] ?? null
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(firstInStock)

  if (variants.length === 0) {
    return (
      <p className="text-sm text-[#7A6E65] italic">
        No hay variantes disponibles para este producto.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <VariantSelector
        variants={variants}
        onVariantChange={setSelectedVariant}
      />
      <AddToCartButton
        product={product}
        variant={selectedVariant}
      />
    </div>
  )
}