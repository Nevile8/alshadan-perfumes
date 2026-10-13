import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ORDER_STATUSES,
  ORDER_STATUS_CARD,
  ORDER_STATUS_HINT,
  ORDER_STATUS_LABEL,
} from '@/lib/order-status'

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const [{ count: totalProducts }, { count: activeProducts }, { count: totalOrders }, ...statusCounts] =
    await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      ...ORDER_STATUSES.map((status) =>
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', status)
      ),
    ])

  const byStatus = ORDER_STATUSES.map((status, i) => ({ status, count: statusCounts[i].count ?? 0 }))

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

      {/* Orders by status */}
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-neutral-400 text-xs tracking-wider uppercase">Órdenes por estado</h3>
        <Link href="/admin/orders" className="text-neutral-500 hover:text-white text-xs transition-colors">
          {totalOrders ?? 0} en total · Ver todas →
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {byStatus.map(({ status, count }) => {
          const style = ORDER_STATUS_CARD[status]
          return (
            <Link
              key={status}
              href={`/admin/orders?status=${status}`}
              className={`bg-neutral-900 border border-neutral-800 border-t-4 ${style.border} rounded-lg p-5 hover:bg-neutral-800/60 transition-colors`}
            >
              <p className="flex items-center gap-2 text-neutral-300 text-xs tracking-wider uppercase mb-2">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                {ORDER_STATUS_LABEL[status]}
              </p>
              <p className={`text-3xl font-light mb-1 ${count > 0 ? style.text : 'text-neutral-600'}`}>{count}</p>
              <p className="text-neutral-600 text-xs">{ORDER_STATUS_HINT[status]}</p>
            </Link>
          )
        })}
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <p className="text-neutral-500 text-xs tracking-wider uppercase mb-2">Total Productos</p>
          <p className="text-3xl font-light text-white mb-1">{totalProducts ?? 0}</p>
          <p className="text-neutral-600 text-xs">{activeProducts ?? 0} activos</p>
        </div>
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
