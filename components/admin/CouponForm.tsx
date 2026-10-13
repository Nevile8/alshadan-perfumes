'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { createCoupon, updateCoupon, type CouponFormState } from '@/app/admin/coupons/actions'
import { toChileDateInput } from '@/lib/coupons'
import type { Coupon } from '@/lib/types/database'
import { LIMITS } from '@/lib/limits'

const inputClass =
  'w-full bg-neutral-800 border border-neutral-700 rounded px-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors'
const labelClass = 'block text-xs text-neutral-400 tracking-wider uppercase mb-2'
const hintClass  = 'text-[11px] text-neutral-600 mt-1'

export function CouponForm({ coupon }: { coupon?: Coupon }) {
  const action = coupon ? updateCoupon.bind(null, coupon.id) : createCoupon
  const [state, formAction, isPending] = useActionState<CouponFormState, FormData>(action, null)
  const [type, setType] = useState<'percentage' | 'fixed'>(coupon?.discount_type ?? 'percentage')
  const [code, setCode] = useState(coupon?.code ?? '')
  const codeLocked = !!coupon && coupon.current_uses > 0

  function generateCode() {
    // 6 random digits; the server still rejects a code that already exists
    const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
    setCode(String(n).padStart(6, '0'))
  }

  return (
    <form action={formAction} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-5 max-w-2xl">
      <div>
        <label htmlFor="code" className={labelClass}>Código</label>
        <div className="flex gap-2">
          <input
            id="code" name="code" required value={code} onChange={(e) => setCode(e.target.value)} readOnly={codeLocked}
            placeholder="VERANO10" maxLength={LIMITS.couponCode}
            className={`${inputClass} font-mono uppercase ${codeLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
          {!codeLocked && (
            <button type="button" onClick={generateCode}
                    className="px-4 text-xs text-neutral-300 border border-neutral-700 rounded hover:border-neutral-500 hover:text-white transition-colors whitespace-nowrap">
              Generar 6 dígitos
            </button>
          )}
        </div>
        <p className={hintClass}>
          {codeLocked ? 'Ya fue usado, así que el código no se puede cambiar.' : 'Letras, números, guion o guion bajo. Los clientes pueden escribirlo en mayúsculas o minúsculas.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="discount_type" className={labelClass}>Tipo de descuento</label>
          <select id="discount_type" name="discount_type" value={type}
                  onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')} className={inputClass}>
            <option value="percentage">Porcentaje (%)</option>
            <option value="fixed">Monto fijo ($)</option>
          </select>
        </div>
        <div>
          <label htmlFor="discount_value" className={labelClass}>{type === 'percentage' ? 'Descuento (%)' : 'Descuento ($)'}</label>
          <input id="discount_value" name="discount_value" type="number" required
                 min={1} max={type === 'percentage' ? 100 : undefined} step={type === 'percentage' ? 'any' : 1}
                 defaultValue={coupon ? Number(coupon.discount_value) : ''} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="min_purchase" className={labelClass}>Compra mínima ($)</label>
          <input id="min_purchase" name="min_purchase" type="number" min={0} step={1}
                 defaultValue={coupon?.min_purchase ?? ''} placeholder="Sin mínimo" className={inputClass} />
        </div>
        <div>
          <label htmlFor="max_uses" className={labelClass}>Máximo de usos</label>
          <input id="max_uses" name="max_uses" type="number" min={1} step={1}
                 defaultValue={coupon?.max_uses ?? ''} placeholder="Ilimitado" className={inputClass} />
          {coupon && <p className={hintClass}>Usado {coupon.current_uses} {coupon.current_uses === 1 ? 'vez' : 'veces'}.</p>}
        </div>
        <div>
          <label htmlFor="expires_at" className={labelClass}>Vence el</label>
          <input id="expires_at" name="expires_at" type="date"
                 defaultValue={toChileDateInput(coupon?.expires_at ?? null)} className={inputClass} />
          <p className={hintClass}>Válido hasta las 23:59 (Chile). Vacío = no vence.</p>
        </div>
      </div>

      {state?.error   && <p className="text-red-400 text-sm">{state.error}</p>}
      {state?.success && <p className="text-green-400 text-sm">Cupón guardado.</p>}

      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={isPending}
                className="px-5 py-2.5 bg-white text-black text-xs font-medium tracking-widest uppercase rounded hover:bg-neutral-200 transition-colors disabled:opacity-50">
          {isPending ? 'Guardando...' : coupon ? 'Guardar cambios' : 'Crear cupón'}
        </button>
        <Link href="/admin/coupons" className="text-xs text-neutral-500 hover:text-white transition-colors">Cancelar</Link>
      </div>
    </form>
  )
}
