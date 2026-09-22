'use client'

import { useState, useTransition } from 'react'
import { updateCommunePrice, toggleCommuneActive } from '@/app/admin/shipping/actions'
import { formatPrice } from '@/lib/utils'
import type { Commune } from '@/lib/types/database'

export function CommuneTable({ communes }: { communes: Commune[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-neutral-800">
          <th className="text-left px-5 py-2.5 text-xs text-neutral-500 tracking-wider uppercase font-normal">
            Comuna
          </th>
          <th className="text-left px-5 py-2.5 text-xs text-neutral-500 tracking-wider uppercase font-normal">
            Precio Base
          </th>
          <th className="text-left px-5 py-2.5 text-xs text-neutral-500 tracking-wider uppercase font-normal">
            Estado
          </th>
          <th className="text-right px-5 py-2.5 text-xs text-neutral-500 tracking-wider uppercase font-normal">
            Accion
          </th>
        </tr>
      </thead>
      <tbody>
        {communes.map((c) => (
          <CommuneRow key={c.id} commune={c} />
        ))}
      </tbody>
    </table>
  )
}

function CommuneRow({ commune }: { commune: Commune }) {
  const [price, setPrice]     = useState(String(commune.base_price))
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  function savePrice() {
    const num = parseInt(price)
    if (isNaN(num) || num < 0) return
    startTransition(async () => {
      const r = await updateCommunePrice(commune.id, num)
      setMsg(r.error ?? 'OK')
      setTimeout(() => setMsg(null), 2000)
      setEditing(false)
    })
  }

  function toggleActive() {
    startTransition(async () => {
      await toggleCommuneActive(commune.id, !commune.is_active)
    })
  }

  return (
    <tr className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/20 transition-colors">
      <td className="px-5 py-3 text-neutral-300">{commune.commune_name}</td>
      <td className="px-5 py-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-28 bg-neutral-800 border border-neutral-600 rounded px-2 py-1
                         text-white text-xs focus:outline-none focus:border-neutral-400"
            />
            <button
              onClick={savePrice}
              disabled={isPending}
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              {isPending ? '...' : 'Guardar'}
            </button>
            <button
              onClick={() => { setEditing(false); setPrice(String(commune.base_price)) }}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-neutral-300">{formatPrice(commune.base_price)}</span>
            {msg && <span className="text-xs text-green-400">{msg === 'OK' ? '✓' : msg}</span>}
          </div>
        )}
      </td>
      <td className="px-5 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          commune.is_active
            ? 'bg-green-950/50 text-green-400 border border-green-900/50'
            : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
        }`}>
          {commune.is_active ? 'Activa' : 'Inactiva'}
        </span>
      </td>
      <td className="px-5 py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Editar precio
            </button>
          )}
          <button
            onClick={toggleActive}
            disabled={isPending}
            className={`text-xs transition-colors ${
              commune.is_active
                ? 'text-red-500 hover:text-red-300'
                : 'text-green-500 hover:text-green-300'
            }`}
          >
            {commune.is_active ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </td>
    </tr>
  )
}