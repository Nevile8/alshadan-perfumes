'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/lib/store/cart'

/**
 * Client component — reads cart count from Zustand and opens the drawer.
 * Extracted so the parent Header stays a Server Component.
 * Uses 'mounted' pattern to avoid SSR hydration mismatch from localStorage.
 */
export function CartButton() {
  const { openDrawer, getTotalItems } = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const count = mounted ? getTotalItems() : 0

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="relative p-2 text-[#7A6E65] hover:text-[#2C221E] transition-colors"
      aria-label={`Carrito${count > 0 ? ` — ${count} productos` : ''}`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>

      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 bg-[#E86A33] text-white text-[10px]
                     font-bold rounded-full flex items-center justify-center leading-none"
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}