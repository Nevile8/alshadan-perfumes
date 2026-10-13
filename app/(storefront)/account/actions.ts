'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LIMITS } from '@/lib/limits'

export type FormState = { success: boolean; error: string | null } | null

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Tu sesión expiró. Vuelve a ingresar.' }

  const fullName = formData.get('full_name')?.toString().trim().slice(0, LIMITS.name) ?? ''
  const phone    = formData.get('phone')?.toString().trim().slice(0, LIMITS.phone) ?? ''

  if (!fullName) return { success: false, error: 'Ingresa tu nombre.' }

  // RLS + column grants (migration 004) only allow editing your own name and phone
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ full_name: fullName, phone: phone || null })
    .eq('id', user.id)

  if (error) {
    console.error('[Account] Profile update failed', error)
    return { success: false, error: 'No pudimos guardar tus datos. Intenta de nuevo.' }
  }

  revalidatePath('/account')
  return { success: true, error: null }
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { success: false, error: 'Tu sesión expiró. Vuelve a ingresar.' }

  const current = formData.get('current_password')?.toString() ?? ''
  const next    = formData.get('new_password')?.toString() ?? ''
  const confirm = formData.get('confirm_password')?.toString() ?? ''

  if (current.length > LIMITS.passwordMax) return { success: false, error: 'La contraseña actual no es correcta.' }
  if (next.length < LIMITS.passwordMin || next.length > LIMITS.passwordMax) {
    return { success: false, error: `La nueva contraseña debe tener entre ${LIMITS.passwordMin} y ${LIMITS.passwordMax} caracteres.` }
  }
  if (next !== confirm) return { success: false, error: 'Las contraseñas no coinciden.' }

  // Confirm the current password so an unattended session can't be taken over
  const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password: current })
  if (authError) return { success: false, error: 'La contraseña actual no es correcta.' }

  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) {
    console.error('[Account] Password update failed', error)
    return { success: false, error: 'No pudimos cambiar la contraseña. Intenta de nuevo.' }
  }

  return { success: true, error: null }
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
