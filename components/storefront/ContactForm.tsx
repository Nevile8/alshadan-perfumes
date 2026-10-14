'use client'

import { useActionState } from 'react'
import { submitContactForm, type ContactFormState } from '@/app/(storefront)/actions'
import { LIMITS } from '@/lib/limits'

const inputClass = `w-full px-4 py-2.5 text-sm bg-onyx-card border border-line rounded-lg
                    text-ivory placeholder-smoke focus:outline-none focus:border-gold transition-colors`

export function ContactForm() {
  const [state, formAction, isPending] = useActionState<ContactFormState, FormData>(submitContactForm, null)

  if (state?.success) {
    return (
      <p className="text-sm text-ivory bg-onyx-card border border-line rounded-lg px-4 py-3">
        ¡Gracias! Recibimos tu mensaje y te responderemos pronto.
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-3">
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <input name="name" type="text" placeholder="Nombre" required maxLength={LIMITS.name} className={inputClass} />
      <input name="email" type="email" placeholder="Correo electronico" required maxLength={LIMITS.email} className={inputClass} />
      <textarea
        name="message"
        placeholder="Mensaje"
        rows={3}
        required
        maxLength={LIMITS.message}
        className={`${inputClass} resize-none`}
      />
      {state?.error && <p className="text-red-500 text-xs">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 bg-gold text-onyx text-xs font-medium tracking-widest
                   uppercase rounded-lg hover:bg-gold-deep transition-colors disabled:opacity-50"
      >
        {isPending ? 'Enviando...' : 'Enviar Mensaje'}
      </button>
    </form>
  )
}
