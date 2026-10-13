'use server'

import { sendContactMessage } from '@/lib/email'

export type ContactFormState = { success: boolean; error: string | null } | null

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Footer contact form: forwards the message to the store inbox via Resend. */
export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Honeypot: hidden field real visitors never fill in
  if (formData.get('website')) return { success: true, error: null }

  const name    = formData.get('name')?.toString().trim().slice(0, 100)
  const email   = formData.get('email')?.toString().trim().slice(0, 254)
  const message = formData.get('message')?.toString().trim().slice(0, 5000)

  if (!name || !email || !message) {
    return { success: false, error: 'Todos los campos son obligatorios.' }
  }
  if (!EMAIL_RE.test(email)) {
    return { success: false, error: 'Ingresa un correo válido.' }
  }

  const sent = await sendContactMessage(name, email, message)
  if (!sent) {
    return { success: false, error: 'No pudimos enviar tu mensaje. Escríbenos a contacto@alshadan.com.' }
  }

  return { success: true, error: null }
}
