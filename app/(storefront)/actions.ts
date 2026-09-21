'use server'

/**
 * Contact / newsletter form submission stub.
 * Phase 6 will wire this to Gmail SMTP.
 */
export async function submitContactForm(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const name    = formData.get('name')?.toString().trim()
  const email   = formData.get('email')?.toString().trim()
  const message = formData.get('message')?.toString().trim()

  if (!name || !email || !message) {
    return { success: false, error: 'Todos los campos son obligatorios.' }
  }

  // TODO Phase 6: send email via Gmail SMTP / Resend
  console.log('[contact form]', { name, email, message })

  return { success: true }
}