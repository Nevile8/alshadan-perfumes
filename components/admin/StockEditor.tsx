'use client'

import { useState, useTransition } from 'react'
import { updateVariantStock } from '@/app/admin/actions'

const MAX_STOCK = 100_000

/** Inline stock editor for one variant in the admin products list. */
export function StockEditor({ variantId, sizeMl, stock }: { variantId: string; sizeMl: number; stock: number }) {
  const [saved, setSaved] = useState(stock)
  const [value, setValue] = useState(String(stock))
  const [error, setError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Keep in sync when the server sends a new value (e.g. after a sale + refresh)
  const [lastProp, setLastProp] = useState(stock)
  if (stock !== lastProp) {
    setLastProp(stock)
    if (Number(value) === saved) setValue(String(stock))
    setSaved(stock)
  }

  const parsed = /^\d+$/.test(value.trim()) ? Number(value.trim()) : NaN
  const valid = Number.isInteger(parsed) && parsed >= 0 && parsed <= MAX_STOCK
  const dirty = valid ? parsed !== saved : value.trim() !== String(saved)

  function step(delta: number) {
    const base = valid ? parsed : saved
    setValue(String(Math.min(MAX_STOCK, Math.max(0, base + delta))))
    setError(null)
    setJustSaved(false)
  }

  function save() {
    if (!valid) {
      setError('Ingresa un número entero entre 0 y 100.000.')
      return
    }
    if (!dirty) return
    startTransition(async () => {
      const result = await updateVariantStock(variantId, parsed, saved)
      if (result.stock != null) {
        setSaved(result.stock)
        setValue(String(result.stock))
      }
      setError(result.error)
      setJustSaved(!result.error)
    })
  }

  function reset() {
    setValue(String(saved))
    setError(null)
  }

  const tone = saved === 0 ? 'text-red-400' : saved <= 3 ? 'text-amber-400' : 'text-neutral-400'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className={`w-14 text-xs tabular-nums ${tone}`} title={saved === 0 ? 'Agotado' : saved <= 3 ? 'Stock bajo' : undefined}>
          {sizeMl} ml
        </span>
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={isPending || (valid ? parsed : saved) <= 0}
          aria-label={`Restar 1 al stock de ${sizeMl} ml`}
          className="w-6 h-6 rounded border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 disabled:opacity-30 transition-colors"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_STOCK}
          step={1}
          value={value}
          disabled={isPending}
          aria-label={`Stock de ${sizeMl} ml`}
          onChange={(e) => { setValue(e.target.value); setError(null); setJustSaved(false) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); save() }
            if (e.key === 'Escape') reset()
          }}
          className={`w-16 h-6 px-1.5 rounded bg-neutral-950 border text-center text-xs tabular-nums text-white focus:outline-none focus:border-neutral-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
            valid ? 'border-neutral-700' : 'border-red-700'
          }`}
        />
        <button
          type="button"
          onClick={() => step(1)}
          disabled={isPending || (valid ? parsed : saved) >= MAX_STOCK}
          aria-label={`Sumar 1 al stock de ${sizeMl} ml`}
          className="w-6 h-6 rounded border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 disabled:opacity-30 transition-colors"
        >
          +
        </button>
        {dirty ? (
          <>
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="ml-1 px-2 h-6 rounded bg-white text-black text-[10px] font-medium tracking-wider uppercase hover:bg-neutral-200 disabled:opacity-40 transition-colors"
            >
              {isPending ? '...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={isPending}
              className="text-[10px] text-neutral-500 hover:text-white disabled:opacity-40 transition-colors"
            >
              Cancelar
            </button>
          </>
        ) : justSaved ? (
          <span className="ml-1 text-[10px] text-green-400" role="status">Guardado</span>
        ) : null}
      </div>
      {error && <p className="text-[11px] text-red-400 max-w-64" role="alert">{error}</p>}
    </div>
  )
}
