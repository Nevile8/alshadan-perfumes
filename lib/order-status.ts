import type { OrderStatus } from '@/lib/types/database'

/** Workflow order, used for sorting and for the dashboard cards. */
export const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending:   'Pendiente de pago',
  paid:      'Pagado · por enviar',
  shipped:   'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending:   'bg-yellow-950/50 text-yellow-400 border-yellow-900/50',
  paid:      'bg-blue-950/50 text-blue-400 border-blue-900/50',
  shipped:   'bg-purple-950/50 text-purple-400 border-purple-900/50',
  delivered: 'bg-green-950/50 text-green-400 border-green-900/50',
  cancelled: 'bg-red-950/50 text-red-400 border-red-900/50',
}

/** Card accents for the dashboard: a coloured top border and number. */
export const ORDER_STATUS_CARD: Record<OrderStatus, { border: string; text: string; dot: string }> = {
  pending:   { border: 'border-t-yellow-500', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  paid:      { border: 'border-t-blue-500',   text: 'text-blue-400',   dot: 'bg-blue-500' },
  shipped:   { border: 'border-t-purple-500', text: 'text-purple-400', dot: 'bg-purple-500' },
  delivered: { border: 'border-t-green-500',  text: 'text-green-400',  dot: 'bg-green-500' },
  cancelled: { border: 'border-t-red-500',    text: 'text-red-400',    dot: 'bg-red-500' },
}

export const ORDER_STATUS_HINT: Record<OrderStatus, string> = {
  pending:   'Checkout iniciado, pago no confirmado',
  paid:      'Listos para despachar',
  shipped:   'En camino al cliente',
  delivered: 'Completados',
  cancelled: 'Anulados o pago vencido',
}
