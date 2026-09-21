import { NextResponse, type NextRequest } from 'next/server'
import { createProxyClient } from '@/lib/supabase/middleware'

/**
 * Next.js 16 Proxy (replaces middleware.ts).
 * Runs on the Node.js runtime on every matched request.
 *
 * Responsibilities:
 *  1. Refresh the Supabase auth session (keep cookies alive).
 *  2. Protect /admin/* — must be authenticated AND have role = 'admin'.
 *  3. Protect /account/* — must be authenticated.
 *  4. Redirect authenticated users away from /auth/login and /auth/register.
 */
export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = await createProxyClient(request)
  const pathname = request.nextUrl.pathname

  // Always refresh the session — this keeps the auth token alive.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Redirect logged-in users away from auth pages ──────────────────────────
  if (user && (pathname === '/auth/login' || pathname === '/auth/register')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ── Protected: /account/* ──────────────────────────────────────────────────
  if (pathname.startsWith('/account')) {
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── Protected: /admin/* ────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check role from profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = profileData as { role: string } | null

    if (profile?.role !== 'admin') {
      return new NextResponse('Acceso denegado', { status: 403 })
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - Common image extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
