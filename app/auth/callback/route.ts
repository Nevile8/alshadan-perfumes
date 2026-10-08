import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback Route Handler.
 * Exchanges the Supabase auth code for a session.
 * Handles email confirmation redirects and OAuth flows.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const requestedNext = searchParams.get('next') ?? '/'
  // Only allow same-site relative paths ("/foo"), never "//evil.com" or "@evil.com"
  const next =
    requestedNext.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.startsWith('/\\')
      ? requestedNext
      : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there's no code or an error, redirect to login with an error param
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
