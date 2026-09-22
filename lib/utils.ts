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
