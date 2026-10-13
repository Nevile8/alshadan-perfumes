'use client'

import { useActionState } from 'react'
import { submitContactForm, type ContactFormState } from '@/app/(storefront)/actions'

const inputClass = `w-full px-4 py-2.5 text-sm bg-white border border-[#E8DEC8] rounded-lg
                    text-[#2C221E] placeholder-[#7A6E65] focus:outline-none focus:border-[#D4A054] transition-colors`

export function ContactForm() {
  const [state, formAction, isPending] = useActionState<ContactFormState, FormData>(submitContactForm, null)

  if (state?.success) {
    return (
      <p className="text-sm text-[#2C221E] bg-white border border-[#E8DEC8] rounded-lg px-4 py-3">
        ¡Gracias! Recibimos tu mensaje y te responderemos pronto.
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-3">
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <input name="name" type="text" placeholder="Nombre" required maxLength={100} className={inputClass} />
      <input name="email" type="email" placeholder="Correo electronico" required maxLength={254} className={inputClass} />
      <textarea
        name="message"
        placeholder="Mensaje"
        rows={3}
        required
        maxLength={5000}
        className={`${inputClass} resize-none`}
      />
      {state?.error && <p className="text-red-500 text-xs">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 bg-[#E86A33] text-white text-xs font-medium tracking-widest
                   uppercase rounded-lg hover:bg-[#d05a28] transition-colors disabled:opacity-50"
      >
        {isPending ? 'Enviando...' : 'Enviar Mensaje'}
      </button>
    </form>
  )
}
