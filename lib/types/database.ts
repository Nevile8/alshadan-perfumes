// ─── Enum Types ───────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'admin'
export type ProductGender = 'hombre' | 'mujer' | 'unisex'
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type DiscountType = 'percentage' | 'fixed'

// ─── Table Row Types ──────────────────────────────────────────────────────────

export interface Profile {
  id: string                  // FK → auth.users.id
  full_name: string | null
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  brand: string
  slug: string
  gender: ProductGender
  description: string | null
  olfactory_notes: string[]   // e.g. ['bergamot', 'sandalwood', 'musk']
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string          // FK → products.id
  size_ml: number             // e.g. 50, 100, 200
  price: number               // in CLP (Chilean Pesos)
  stock: number
  sku: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string             // FK → auth.users.id
  status: OrderStatus
  subtotal: number
  discount: number
  shipping_cost: number
  total: number
  coupon_code: string | null
  shipping_address: ShippingAddress
  payment_provider: string | null   // 'mercadopago' | 'webpay'
  payment_reference: string | null  // external payment ID
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string            // FK → orders.id
  variant_id: string          // FK → product_variants.id
  product_name: string        // snapshot at time of purchase
  size_ml: number             // snapshot
  quantity: number
  unit_price: number          // snapshot
  created_at: string
}

export interface Coupon {
  id: string
  code: string                // unique, case-insensitive
  discount_type: DiscountType
  discount_value: number      // percentage (0-100) or fixed amount in CLP
  min_purchase: number | null // minimum cart total to apply coupon
  max_uses: number | null     // null = unlimited
  current_uses: number
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Nested / Helper Types ────────────────────────────────────────────────────

export interface ShippingAddress {
  full_name: string
  rut: string
  email: string
  phone: string
  address: string
  commune: string
  region: string
  country: string
  extra_info?: string
}

/** Product with its variants pre-loaded */
export type ProductWithVariants = Product & {
  product_variants: ProductVariant[]
}

/** Order with its items pre-loaded */
export type OrderWithItems = Order & {
  order_items: (OrderItem & { product_variants: ProductVariant & { products: Product } })[]
}

// ─── Supabase Database Generic Type ──────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
      }
      product_variants: {
        Row: ProductVariant
        Insert: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id' | 'created_at'>
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>
      }
      coupons: {
        Row: Coupon
        Insert: Omit<Coupon, 'id' | 'current_uses' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Coupon, 'id' | 'created_at' | 'updated_at'>>
      }
    }
    Enums: {
      user_role: UserRole
      product_gender: ProductGender
      order_status: OrderStatus
      discount_type: DiscountType
    }
  }
}
