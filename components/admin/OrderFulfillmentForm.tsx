'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderFulfillment } from '@/app/admin/orders/actions'
import type { OrderStatus } from '@/lib/types/database'

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending',   label: 'Pendiente' },
  { value: 'paid',      label: 'Pagado' },
  { value: 'shipped',   label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
]

interface Props {
  orderId:              string
  currentStatus:        OrderStatus
  currentTrackingNumber: string | null
  currentTrackingUrl:    string | null
}

export function OrderFulfillmentForm({
  orderId, currentStatus, currentTrackingNumber, currentTrackingUrl
}: Props) {
  const [status,   setStatus]   = useState<OrderStatus>(currentStatus)
  const [trackNum, setTrackNum] = useState(currentTrackingNumber ?? '')
  const [trackUrl, setTrackUrl] = useState(currentTrackingUrl ?? '')
  const [message,  setMessage]  = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateOrderFulfillment(
        orderId,
        status,
        status === 'shipped' ? trackNum : null,
        status === 'shipped' ? trackUrl : null
      )
      if (result.error) {
        setMessage({ text: result.error, ok: false })
      } else {
        setMessage({ text: 'Orden actualizada correctamente.', ok: true })
        router.refresh()
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  const inputClass = `w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg
                      text-sm text-white placeholder-neutral-500
                      focus:outline-none focus:border-neutral-500 transition-colors`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Status */}
      <div>
        <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">
          Estado del Pedido
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className={inputClass}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Tracking — only show when shipped */}
      {status === 'shipped' && (
        <>
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">
              Número de Tracking
            </label>
            <input
              type="text"
              value={trackNum}
              onChange={(e) => setTrackNum(e.target.value)}
              placeholder="Ej: 123456789"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">
              URL de Seguimiento (enlace al courier)
            </label>
            <input
              type="url"
              value={trackUrl}
              onChange={(e) => setTrackUrl(e.target.value)}
              placeholder="https://starken.cl/rastreo?codigo=..."
              className={inputClass}
            />
            {trackUrl && (
              <a
                href={trackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
              >
                Probar enlace →
              </a>
            )}
          </div>
        </>
      )}

      {message && (
        <p className={`text-xs px-3 py-2 rounded-lg ${
          message.ok
            ? 'bg-green-950/50 text-green-400 border border-green-900/50'
            : 'bg-red-950/50 text-red-400 border border-red-900/50'
        }`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 bg-white text-black text-xs font-medium tracking-widest uppercase
                   rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : 'Actualizar Orden'}
      </button>
    </form>
  )
}