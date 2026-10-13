'use client'

import { useActionState } from 'react'
import { updateProfile, type FormState } from '@/app/(storefront)/account/actions'

const inputClass = `w-full px-4 py-2.5 text-sm bg-white border border-[#E8DEC8] rounded-lg
                    text-[#2C221E] placeholder-[#7A6E65] focus:outline-none focus:border-[#D4A054] transition-colors`
const labelClass = 'block text-xs text-[#7A6E65] uppercase tracking-wider mb-2'

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
        <input id="full_name" name="full_name" type="text" defaultValue={fullName} required maxLength={100}
               autoComplete="name" className={inputClass} />
      </div>
      <div>
        <label htmlFor="phone" className={labelClass}>Teléfono</label>
        <input id="phone" name="phone" type="tel" defaultValue={phone} maxLength={30}
               autoComplete="tel" placeholder="+56 9 1234 5678" className={inputClass} />
      </div>
      {state?.error && <p className="text-red-500 text-xs">{state.error}</p>}
      {state?.success && <p className="text-green-700 text-xs">Datos guardados.</p>}
      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 bg-[#E86A33] text-white text-xs font-medium tracking-widest uppercase
                   rounded-lg hover:bg-[#d05a28] transition-colors disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}
