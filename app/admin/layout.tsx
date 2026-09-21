import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '@/app/admin/actions'

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/products', label: 'Productos', icon: '◈' },
  { href: '/admin/orders', label: 'Órdenes', icon: '◎' },
  { href: '/admin/coupons', label: 'Cupones', icon: '◇' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-neutral-900 border-r border-neutral-800 flex flex-col fixed inset-y-0 left-0 z-10">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-neutral-800">
          <p className="text-[10px] tracking-[0.3em] text-neutral-500 uppercase">Admin</p>
          <h1 className="text-lg font-light tracking-widest text-white uppercase mt-0.5">
            Alshadan
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors text-sm group"
            >
              <span className="text-neutral-600 group-hover:text-neutral-400 transition-colors">
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User + Sign out */}
        <div className="px-4 py-4 border-t border-neutral-800">
          <p className="text-[11px] text-neutral-600 truncate mb-2">{user.email}</p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full text-left text-xs text-neutral-500 hover:text-red-400 transition-colors py-1"
            >
              Cerrar sesión →
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
