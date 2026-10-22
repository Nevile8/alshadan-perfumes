/**
 * Maximum lengths for every text field, shared by the forms (maxLength) and the
 * server actions that validate them. Client limits are only a convenience:
 * Server Actions are public endpoints, so the server always re-checks.
 */
export const LIMITS = {
  // People / contact
  name:        100,
  email:       254,
  phone:       30,
  rut:         20,
  address:     200,
  extraInfo:   300,
  message:     5000,
  // Auth (Supabase hashes passwords with bcrypt, which ignores bytes past 72)
  passwordMin: 8,
  passwordMax: 72,
  // Store
  couponCode:  30,
  orderCode:   40,
  search:      80,
  // Admin: products
  productName:   120,
  brand:         80,
  slug:          140,
  description:   3000,
  noteLength:    40,
  notesCount:    20,
  sku:           40,
  variantsCount: 20,
  galleryCount:  8,
  // Admin: orders
  trackingNumber: 60,
  trackingUrl:    500,
} as const

/** Trimmed string within `max` characters, or null if missing / wrong type / too long. */
export function cleanString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length <= max ? trimmed : null
}

/** Only absolute http(s) URLs, so a stored link can never become `javascript:`. */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch {
    return null
  }
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
