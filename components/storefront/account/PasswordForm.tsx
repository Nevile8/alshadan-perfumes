'use client'

import { useActionState } from 'react'
import { changePassword, type FormState } from '@/app/(storefront)/account/actions'

const inputClass = `w-full px-4 py-2.5 text-sm bg-white border border-[#E8DEC8] rounded-lg
                    text-[#2C221E] placeholder-[#7A6E65] focus:outline-none focus:border-[#D4A054] transition-colors`
const labelClass = 'block text-xs text-[#7A6E65] uppercase tracking-wider mb-2'

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(changePassword, null)

  return (
    // key resets the inputs after a successful change
    <form key={state?.success ? 'done' : 'form'} action={formAction} className="space-y-4">
      <div>
        <label htmlFor="current_password" className={labelClass}>Contraseña actual</label>
        <input id="current_password" name="current_password" type="password" required
               autoComplete="current-password" className={inputClass} />
      </div>
      <div>
        <label htmlFor="new_password" className={labelClass}>Nueva contraseña</label>
        <input id="new_password" name="new_password" type="password" required minLength={8}
               autoComplete="new-password" className={inputClass} />
      </div>
      <div>
        <label htmlFor="confirm_password" className={labelClass}>Repite la nueva contraseña</label>
        <input id="confirm_password" name="confirm_password" type="password" required minLength={8}
               autoComplete="new-password" className={inputClass} />
      </div>
      {state?.error && <p className="text-red-500 text-xs">{state.error}</p>}
      {state?.success && <p className="text-green-700 text-xs">Contraseña actualizada.</p>}
      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 border border-[#D4A054] text-[#D4A054] text-xs font-medium tracking-widest uppercase
                   rounded-lg hover:bg-[#D4A054] hover:text-white transition-colors disabled:opacity-50"
      >
        {isPending ? 'Cambiando...' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}
