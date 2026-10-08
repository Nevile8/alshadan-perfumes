import { createClient } from '@/lib/supabase/server'

/**
 * Ensures the current request comes from a logged-in user with role = 'admin'.
 * Server Actions and Route Handlers are public endpoints, so every admin
 * action must call this itself — proxy.ts only guards /admin page URLs.
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autorizado')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: string } | null
  if (profile?.role !== 'admin') throw new Error('No autorizado')

  return user
}
