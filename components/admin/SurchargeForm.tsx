'use client'

import { useState, useTransition } from 'react'
import { updateSurchargePercent } from '@/app/admin/shipping/actions'

export function SurchargeForm({ currentValue }: { currentValue: number }) {
  const [value, setValue] = useState(String(currentValue))
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = parseFloat(value)
    if (isNaN(num)) return
    startTransition(async () => {
      const result = await updateSurchargePercent(num)
      setMessage(result.error
        ? { text: result.error, ok: false }
        : { text: 'Porcentaje actualizado correctamente.', ok: true })
      setTimeout(() => setMessage(null), 3000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-4">
      <div>
        <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">
          Porcentaje (%)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-28 bg-neutral-800 border border-neutral-700 rounded px-4 py-2.5
                       text-white text-sm focus:outline-none focus:border-neutral-500 transition-colors"
          />
          <span className="text-neutral-500 text-sm">%</span>
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2.5 bg-white text-black text-xs font-medium tracking-widest uppercase
                   rounded hover:bg-neutral-200 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : 'Guardar'}
      </button>
      {message && (
        <p className={`text-sm ${message.ok ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}
    </form>
  )
}