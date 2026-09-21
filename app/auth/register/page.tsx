'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // Callback URL for email confirmation (Phase 1 skips this since we disabled email confirmation)
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Since email confirmation is disabled, sign them in directly
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/')
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
      <h2 className="text-lg font-light text-white tracking-wide mb-6">
        Crear Cuenta
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-xs text-neutral-400 tracking-wider uppercase mb-2">
            Nombre completo
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
            placeholder="Tu Nombre"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs text-neutral-400 tracking-wider uppercase mb-2">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
            placeholder="tu@correo.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs text-neutral-400 tracking-wider uppercase mb-2">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-xs text-neutral-400 tracking-wider uppercase mb-2">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm py-2 px-3 bg-red-950/30 border border-red-900/50 rounded">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black text-sm font-medium tracking-widest uppercase py-3 rounded hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/auth/login" className="text-neutral-300 hover:text-white transition-colors underline underline-offset-2">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
