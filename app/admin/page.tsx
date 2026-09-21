import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const [{ count: totalProducts }, { count: activeProducts }, { count: totalOrders }] =
    await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
    ])

  const stats = [
    { label: 'Total Productos', value: totalProducts ?? 0, sub: `${activeProducts ?? 0} activos` },
    { label: 'Total Órdenes', value: totalOrders ?? 0, sub: 'Todas las órdenes' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light text-white tracking-wide">Dashboard</h2>
          <p className="text-neutral-500 text-sm mt-1">Panel de administración ALSHADAN</p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-white text-black text-xs font-medium tracking-widest uppercase rounded hover:bg-neutral-200 transition-colors"
        >
          + Nuevo Producto
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <p className="text-neutral-500 text-xs tracking-wider uppercase mb-2">{stat.label}</p>
            <p className="text-3xl font-light text-white mb-1">{stat.value}</p>
            <p className="text-neutral-600 text-xs">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-neutral-400 text-xs tracking-wider uppercase mb-4">Acciones Rápidas</h3>
        <div className="flex gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors rounded text-sm"
          >
            Ver todos los productos →
          </Link>
          <Link
            href="/admin/products/seed"
            target="_blank"
            className="px-4 py-2 border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors rounded text-sm"
          >
            Cargar datos de prueba →
          </Link>
        </div>
      </div>
    </div>
  )
}
