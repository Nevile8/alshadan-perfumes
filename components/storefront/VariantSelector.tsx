'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/utils'
import type { ProductVariant } from '@/lib/types/database'

interface VariantSelectorProps {
  variants:         ProductVariant[]
  onVariantChange:  (variant: ProductVariant) => void
}

export function VariantSelector({ variants, onVariantChange }: VariantSelectorProps) {
  const sorted = [...variants].sort((a, b) => a.size_ml - b.size_ml)
  const [selectedId, setSelectedId] = useState<string>(sorted[0]?.id ?? '')

  function handleSelect(variant: ProductVariant) {
    setSelectedId(variant.id)
    onVariantChange(variant)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-smoke uppercase tracking-widest">Selecciona el tamano</p>
      <div className="flex flex-wrap gap-3">
        {sorted.map((variant) => {
          const isSelected    = variant.id === selectedId
          const isOutOfStock  = variant.stock === 0

          return (
            <button
              key={variant.id}
              type="button"
              disabled={isOutOfStock}
              onClick={() => handleSelect(variant)}
              className={`relative flex flex-col items-center px-5 py-3 rounded-xl border-2 transition-all
                ${isSelected
                  ? 'border-gold bg-gold/10 shadow-sm'
                  : 'border-line bg-onyx-card hover:border-gold/50'}
                ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`text-sm font-semibold ${isSelected ? 'text-gold' : 'text-ivory'}`}>
                {variant.size_ml} ml
              </span>
              <span className={`text-xs mt-0.5 ${isSelected ? 'text-gold' : 'text-smoke'}`}>
                {formatPrice(variant.price)}
              </span>
              {isOutOfStock && (
                <span className="absolute -top-2 -right-2 text-[9px] bg-red-900/40 text-red-400 border border-red-800/60 px-1.5 py-0.5 rounded-full">
                  Agotado
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}