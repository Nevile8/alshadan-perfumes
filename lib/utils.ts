/**
 * Format a number as Chilean Pesos (CLP).
 * e.g. 49900 → "$49.900"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Conditionally join class names.
 * Usage: cn('base', condition && 'extra', undefined)
 */
export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
/**
 * Calculate shipping cost.
 * Formula: basePrice + basePrice * (surchargePercent / 100) * extraItems
 * where extraItems = max(0, totalItems - 1)
 */
export function calculateShipping(
  basePrice: number,
  surchargePercent: number,
  totalItems: number
): number {
  const extraItems = Math.max(0, totalItems - 1)
  return Math.round(basePrice + basePrice * (surchargePercent / 100) * extraItems)
}

/**
 * Profit margin as a percentage of the selling price: (price - cost) / price.
 * e.g. price 50000, cost 30000 → 40. Null when there is no cost or no price.
 */
export function profitMargin(price: number, cost: number | null | undefined): number | null {
  if (cost == null || !(price > 0)) return null
  return ((price - cost) / price) * 100
}

/** Sizes a customer can buy right now, smallest first, e.g. [50, 100]. */
export function availableSizes(variants: { size_ml: number; stock: number }[]): number[] {
  const sizes = variants.filter((v) => v.stock > 0).map((v) => v.size_ml)
  return [...new Set(sizes)].sort((a, b) => a - b)
}
