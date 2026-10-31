'use client'

import { useActionState } from 'react'
import { changePassword, type FormState } from '@/app/(storefront)/account/actions'
import { LIMITS } from '@/lib/limits'

const inputClass = `w-full px-4 py-2.5 text-sm bg-surface border border-line rounded-lg
                    text-ink placeholder-muted focus:outline-none focus:border-accent transition-colors`
const labelClass = 'block text-xs text-muted uppercase tracking-wider mb-2'

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(changePassword, null)

  return (
    // key resets the inputs after a successful change
    <form key={state?.success ? 'done' : 'form'} action={formAction} className="space-y-4">
      <div>
        <label htmlFor="current_password" className={labelClass}>Contraseña actual</label>
        <input id="current_password" name="current_password" type="password" required maxLength={LIMITS.passwordMax}
               autoComplete="current-password" className={inputClass} />
      </div>
      <div>
        <label htmlFor="new_password" className={labelClass}>Nueva contraseña</label>
        <input id="new_password" name="new_password" type="password" required minLength={LIMITS.passwordMin} maxLength={LIMITS.passwordMax}
               autoComplete="new-password" className={inputClass} />
      </div>
      <div>
        <label htmlFor="confirm_password" className={labelClass}>Repite la nueva contraseña</label>
        <input id="confirm_password" name="confirm_password" type="password" required minLength={LIMITS.passwordMin} maxLength={LIMITS.passwordMax}
               autoComplete="new-password" className={inputClass} />
      </div>
      {state?.error && <p className="text-red-500 text-xs">{state.error}</p>}
      {state?.success && <p className="text-green-700 text-xs">Contraseña actualizada.</p>}
      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 border border-accent text-accent text-xs font-medium tracking-widest uppercase
                   rounded-lg hover:bg-accent hover:text-page transition-colors disabled:opacity-50"
      >
        {isPending ? 'Cambiando...' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}
