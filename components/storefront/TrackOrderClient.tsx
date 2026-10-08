'use client'

import { useState } from 'react'
import { lookupOrder } from '@/app/(storefront)/track/actions'
import { formatPrice } from '@/lib/utils'
import type { Order, OrderItem, ShippingAddress } from '@/lib/types/database'

const STEPS: { status: string; label: string; icon: string }[] = [
  { status: 'pending',   label: 'Pendiente',  icon: '◎' },
  { status: 'paid',      label: 'Pagado',     icon: '◉' },
  { status: 'shipped',   label: 'Enviado',    icon: '◈' },
  { status: 'delivered', label: 'Entregado',  icon: '✓' },
]

const STATUS_ORDER = ['pending', 'paid', 'shipped', 'delivered']

const inputClass = `w-full px-4 py-3 text-sm bg-white border border-[#E8DEC8] rounded-xl
                    text-[#2C221E] placeholder-[#7A6E65] focus:outline-none focus:border-[#D4A054]
                    transition-colors`

export function TrackOrderClient() {
  const [orderId, setOrderId] = useState('')
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [order,   setOrder]   = useState<(Order & { order_items: OrderItem[] }) | null>(null)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOrder(null)
    const result = await lookupOrder(orderId, email)
    if (result.error) {
      setError(result.error)
    } else {
      setOrder(result.order)
    }
    setLoading(false)
  }

  const currentStepIndex = order ? STATUS_ORDER.indexOf(order.status) : -1
  const isCancelled = order?.status === 'cancelled'

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleLookup} className="bg-white border border-[#E8DEC8] rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs text-[#7A6E65] uppercase tracking-wider mb-2">
            Número de Orden
          </label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className={`${inputClass} font-mono text-xs`}
          />
        </div>
        <div>
          <label className="block text-xs text-[#7A6E65] uppercase tracking-wider mb-2">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="correo@ejemplo.com"
            className={inputClass}
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm py-2 px-3 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#E86A33] text-white text-sm font-medium tracking-widest
                     uppercase rounded-xl hover:bg-[#d05a28] transition-colors disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Rastrear Pedido'}
        </button>
      </form>

      {/* Result */}
      {order && (
        <div className="space-y-5">
          {/* Status Timeline */}
          <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-[#2C221E] uppercase tracking-wider">
                Estado del Pedido
              </h2>
              <span className="text-xs font-mono text-[#7A6E65]">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            {isCancelled ? (
              <div className="mt-4 py-4 text-center">
                <span className="text-sm font-medium text-red-500">✕ Orden Cancelada</span>
              </div>
            ) : (
              <div className="mt-6 flex items-start gap-0">
                {STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex
                  const isCurrent  = idx === currentStepIndex
                  const isLast     = idx === STEPS.length - 1

                  return (
                    <div key={step.status} className="flex-1 flex flex-col items-center">
                      {/* Connector + circle row */}
                      <div className="flex items-center w-full">
                        {/* Left connector */}
                        <div className={`flex-1 h-0.5 ${idx === 0 ? 'invisible' : isCompleted ? 'bg-[#D4A054]' : 'bg-[#E8DEC8]'}`} />
                        {/* Circle */}
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all
                          ${isCurrent  ? 'border-[#D4A054] bg-[#D4A054] text-white shadow-md' :
                            isCompleted ? 'border-[#D4A054] bg-[#D4A054]/10 text-[#D4A054]' :
                                          'border-[#E8DEC8] bg-white text-[#E8DEC8]'}`}>
                          {step.icon}
                        </div>
                        {/* Right connector */}
                        <div className={`flex-1 h-0.5 ${isLast ? 'invisible' : isCompleted && idx < currentStepIndex ? 'bg-[#D4A054]' : 'bg-[#E8DEC8]'}`} />
                      </div>
                      {/* Label */}
                      <p className={`text-xs mt-2 text-center font-medium ${
                        isCurrent  ? 'text-[#D4A054]' :
                        isCompleted ? 'text-[#7A6E65]' : 'text-[#E8DEC8]'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tracking info — only if shipped */}
          {order.status === 'shipped' && order.tracking_number && (
            <div className="bg-[#FDF9F3] border border-[#E8DEC8] rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-[#2C221E] uppercase tracking-wider">
                Información de Envío
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#7A6E65] uppercase tracking-wider mb-1">Número de Tracking</p>
                  <p className="font-mono font-semibold text-[#2C221E]">{order.tracking_number}</p>
                </div>
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#E86A33] text-white text-xs font-medium tracking-widest
                               uppercase rounded-full hover:bg-[#d05a28] transition-colors flex-shrink-0"
                  >
                    Rastrear →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Shipping address */}
          {(() => {
            const addr = order.shipping_address as ShippingAddress
            return (
              <div className="bg-white border border-[#E8DEC8] rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-[#2C221E] uppercase tracking-wider mb-3">
                  Dirección de Entrega
                </h3>
                <p className="text-sm text-[#2C221E] font-medium">{addr.full_name}</p>
                <p className="text-sm text-[#7A6E65]">{addr.address}</p>
                <p className="text-sm text-[#7A6E65]">{addr.commune}, {addr.region}</p>
              </div>
            )
          })()}

          {/* Items summary */}
          <div className="bg-white border border-[#E8DEC8] rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-[#2C221E] uppercase tracking-wider mb-4">
              Resumen del Pedido
            </h3>
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="text-[#2C221E] font-medium">{item.product_name}</p>
                    <p className="text-[#7A6E65] text-xs">{item.size_ml} ml × {item.quantity}</p>
                  </div>
                  <p className="text-[#D4A054] font-semibold">
                    {formatPrice(item.unit_price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-[#E8DEC8] mt-4 pt-4 flex justify-between font-semibold text-[#2C221E] text-sm">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}