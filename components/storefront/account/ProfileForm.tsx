'use client'

import { useActionState } from 'react'
import { updateProfile, type FormState } from '@/app/(storefront)/account/actions'
import { LIMITS } from '@/lib/limits'

const inputClass = `w-full px-4 py-2.5 text-sm bg-onyx-card border border-line rounded-lg
                    text-ivory placeholder-smoke focus:outline-none focus:border-gold transition-colors`
const labelClass = 'block text-xs text-smoke uppercase tracking-wider mb-2'

export function ProfileForm({ email, fullName, phone }: { email: string; fullName: string; phone: string }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(updateProfile, null)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass}>Correo electrónico</label>
        <input type="email" value={email} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
      </div>
      <div>
        <label htmlFor="full_name" className={labelClass}>Nombre completo</label>
        <input id="full_name" name="full_name" type="text" defaultValue={fullName} required maxLength={LIMITS.name}
               autoComplete="name" className={inputClass} />
      </div>
      <div>
        <label htmlFor="phone" className={labelClass}>Teléfono</label>
        <input id="phone" name="phone" type="tel" defaultValue={phone} maxLength={LIMITS.phone}
               autoComplete="tel" placeholder="+56 9 1234 5678" className={inputClass} />
      </div>
      {state?.error && <p className="text-red-500 text-xs">{state.error}</p>}
      {state?.success && <p className="text-green-300 text-xs">Datos guardados.</p>}
      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 bg-gold text-onyx text-xs font-medium tracking-widest uppercase
                   rounded-lg hover:bg-gold-deep transition-colors disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}
