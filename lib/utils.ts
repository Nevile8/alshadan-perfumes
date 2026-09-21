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