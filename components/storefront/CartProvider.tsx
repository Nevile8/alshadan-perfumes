'use client'

import { CartDrawer } from './CartDrawer'

/**
 * Mounts the CartDrawer at the storefront layout level.
 * Must be a Client Component because CartDrawer uses Zustand.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CartDrawer />
    </>
  )
}