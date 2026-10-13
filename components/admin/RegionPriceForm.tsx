'use client'

import { useState, useTransition } from 'react'
import { updateRegionPrice } from '@/app/admin/shipping/actions'
import { formatPrice } from '@/lib/utils'

export function RegionPriceForm({ regionCode, regionName, communeCount }: {
  regionCode: string
  regionName: string
  communeCount: number
}) {
  const [price, setPrice] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = Number(price)
    if (price === '' || !Number.isInteger(num) || num < 0) {
      setMsg({ text: 'Ingresa un precio entero.', ok: false })
      return
    }
    if (!confirm(`¿Cambiar el precio base de las ${communeCount} comunas de ${regionName} a ${formatPrice(num)}?`)) return
    startTransition(async () => {
      const r = await updateRegionPrice(regionCode, num)
      setMsg(r.error ? { text: r.error, ok: false } : { text: `${r.updated} comunas actualizadas`, ok: true })
      if (!r.error) setPrice('')
      setTimeout(() => setMsg(null), 3000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {msg && <span className={`text-xs ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</span>}
      <input
        type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.value)}
        placeholder="Precio región" aria-label={`Precio para toda la región ${regionName}`}
        className="w-32 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white text-xs
                   focus:outline-none focus:border-neutral-500"
      />
      <button type="submit" disabled={isPending}
              className="text-xs text-neutral-300 border border-neutral-700 hover:border-neutral-500 hover:text-white
                         px-3 py-1 rounded transition-colors disabled:opacity-50 whitespace-nowrap">
        {isPending ? '...' : 'Aplicar a la región'}
      </button>
    </form>
  )
}
