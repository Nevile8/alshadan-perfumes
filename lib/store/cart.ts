import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  variantId:   string
  productId:   string
  productName: string
  brand:       string
  slug:        string
  imageUrl:    string | null
  size_ml:     number
  price:       number   // snapshot at time of add
  quantity:    number
}

interface CartState {
  items:       CartItem[]
  isOpen:      boolean

  // Actions
  addItem:        (item: Omit<CartItem, 'quantity'>) => void
  removeItem:     (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart:      () => void
  openDrawer:     () => void
  closeDrawer:    () => void

  // Derived (computed inline)
  getTotalItems: () => number
  getTotalPrice: () => number
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items:  [],
      isOpen: false,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.variantId !== variantId) }
          }
          return {
            items: state.items.map((i) =>
              i.variantId === variantId ? { ...i, quantity } : i
            ),
          }
        }),

      clearCart: () => set({ items: [] }),

      openDrawer:  () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name:    'alshadan-cart',   // localStorage key
      version: 1,
      // Only persist items, not drawer open state
      partialize: (state) => ({ items: state.items }),
    }
  )
)