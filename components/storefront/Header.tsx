import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from './SearchBar'
import { CartButton } from './CartButton'

const NAV_LINKS = [
  { label: 'Perfume de Hombre', href: '/?gender=hombre' },
  { label: 'Perfume de Mujer',  href: '/?gender=mujer' },
  { label: 'Perfume Unisex',   href: '/?gender=unisex' },
]

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="bg-royal border-b border-gold/70 sticky top-0 z-40">
      {/* Top row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo-gold.svg"
              alt="ALSHADAN Luxury Perfumes"
              width={67}
              height={52}
              className="h-11 w-auto object-contain"
              unoptimized
              priority
            />
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:flex">
            <Suspense fallback={
              <div className="w-full h-9 bg-white/10 border border-white/20 rounded-full animate-pulse" />
            }>
              <SearchBar />
            </Suspense>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Cart — client component for live badge */}
            <CartButton />

            {/* Account */}
            {user ? (
              <Link
                href="/account"
                className="text-xs font-medium tracking-wider uppercase text-gold-soft
                           border border-gold/60 px-3 py-1.5 rounded-full
                           hover:border-gold transition-colors hidden sm:inline-block"
              >
                Mi Cuenta
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="text-xs font-medium tracking-wider uppercase text-gold-soft
                           border border-gold px-4 py-1.5 rounded-full
                           hover:bg-gold hover:text-onyx transition-colors hidden sm:inline-block"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden pb-3">
          <Suspense fallback={<div className="w-full h-9 bg-white/10 border border-white/20 rounded-full animate-pulse" />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      {/* Bottom nav row */}
      <div className="border-t border-white/10 bg-royal-deep/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-6 h-10 overflow-x-auto">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium tracking-widest uppercase text-ivory/75
                           hover:text-gold-soft transition-colors whitespace-nowrap
                           border-b-2 border-transparent hover:border-gold py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}