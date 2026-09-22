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
      <p className="text-xs text-[#7A6E65] uppercase tracking-widest">Selecciona el tamano</p>
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
                  ? 'border-[#D4A054] bg-[#D4A054]/10 shadow-sm'
                  : 'border-[#E8DEC8] bg-white hover:border-[#D4A054]/50'}
                ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`text-sm font-semibold ${isSelected ? 'text-[#D4A054]' : 'text-[#2C221E]'}`}>
                {variant.size_ml} ml
              </span>
              <span className={`text-xs mt-0.5 ${isSelected ? 'text-[#D4A054]' : 'text-[#7A6E65]'}`}>
                {formatPrice(variant.price)}
              </span>
              {isOutOfStock && (
                <span className="absolute -top-2 -right-2 text-[9px] bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
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