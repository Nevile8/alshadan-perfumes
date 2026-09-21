import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from './SearchBar'

const NAV_LINKS = [
  { label: 'Perfume de Hombre', href: '/?gender=hombre' },
  { label: 'Perfume de Mujer',  href: '/?gender=mujer' },
  { label: 'Perfume Unisex',   href: '/?gender=unisex' },
]

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="bg-white border-b border-[#E8DEC8] sticky top-0 z-50">
      {/* Top row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/Logo.png"
              alt="ALSHADAN Luxury Perfumes"
              width={140}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:flex">
            <Suspense fallback={
              <div className="w-full h-9 bg-[#FDF9F3] border border-[#E8DEC8] rounded-full animate-pulse" />
            }>
              <SearchBar />
            </Suspense>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-[#7A6E65] hover:text-[#2C221E] transition-colors"
              aria-label="Carrito"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {/* Badge placeholder — Phase 4 */}
            </Link>

            {/* Account */}
            {user ? (
              <Link
                href="/account"
                className="text-xs font-medium tracking-wider uppercase text-[#2C221E]
                           border border-[#E8DEC8] px-3 py-1.5 rounded-full
                           hover:border-[#D4A054] transition-colors"
              >
                Mi Cuenta
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="text-xs font-medium tracking-wider uppercase text-white
                           bg-[#E86A33] px-4 py-1.5 rounded-full
                           hover:bg-[#d05a28] transition-colors"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden pb-3">
          <Suspense fallback={<div className="w-full h-9 bg-[#FDF9F3] border border-[#E8DEC8] rounded-full animate-pulse" />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      {/* Bottom nav row */}
      <div className="border-t border-[#F0E8D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-6 h-10 overflow-x-auto">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium tracking-widest uppercase text-[#7A6E65]
                           hover:text-[#D4A054] transition-colors whitespace-nowrap
                           border-b-2 border-transparent hover:border-[#D4A054] py-2"
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