'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/lib/store/cart'

export function ClearCartClient() {
  const { clearCart } = useCartStore()

  useEffect(() => {
    // Small timeout ensures hydration finishes before wiping Zustand
    const t = setTimeout(() => {
      clearCart()
    }, 500)
    return () => clearTimeout(t)
  }, [clearCart])

  return null
}