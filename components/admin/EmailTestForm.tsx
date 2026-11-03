'use client'

import { useState, useTransition } from 'react'
import { sendTestEmailAction } from '@/app/admin/actions'

export function EmailTestForm({ defaultTo }: { defaultTo: string }) {
  const [to, setTo] = useState(defaultTo)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      try {
        setResult(await sendTestEmailAction(to))
      } catch {
        setResult({ ok: false, message: 'No se pudo enviar. Vuelve a iniciar sesión e inténtalo de nuevo.' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-56">
          <label htmlFor="test-email-to" className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">
            Enviar a
          </label>
          <input
            id="test-email-to"
            type="email"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-4 py-2.5
                       text-white text-sm focus:outline-none focus:border-neutral-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-white text-black text-xs font-medium tracking-widest uppercase
                     rounded hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Enviando...' : 'Enviar correo de prueba'}
        </button>
      </div>
      {result && (
        <p role="status" className={`text-sm break-words whitespace-pre-line ${result.ok ? 'text-green-400' : 'text-red-400'}`}>
          {result.message}
        </p>
      )}
    </form>
  )
}
