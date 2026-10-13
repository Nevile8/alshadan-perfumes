import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { ProfileForm } from '@/components/storefront/account/ProfileForm'
import { PasswordForm } from '@/components/storefront/account/PasswordForm'
import { signOut } from './actions'
import type { Order, OrderItem, OrderStatus, ShippingAddress } from '@/lib/types/database'

export const metadata = { title: 'Mi Cuenta' }

const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  pending:   { label: 'Pago pendiente', className: 'bg-yellow-950/40 text-yellow-300 border-yellow-800/60' },
  paid:      { label: 'Pagado',         className: 'bg-blue-950/40 text-blue-300 border-blue-800/60' },
  shipped:   { label: 'Enviado',        className: 'bg-onyx-raised text-gold border-line' },
  delivered: { label: 'Entregado',      className: 'bg-green-950/40 text-green-300 border-green-800/60' },
  cancelled: { label: 'Cancelado',      className: 'bg-neutral-900/40 text-neutral-400 border-neutral-800/60' },
}

function safeUrl(url: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch {
    return null
  }
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/account')

  const [{ data: profileData }, { data: ordersData }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
    // RLS limits this to the signed-in customer's own orders
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const profile = profileData as { full_name: string | null; phone: string | null } | null
  const orders  = (ordersData ?? []) as (Order & { order_items: OrderItem[] })[]
  const name    = profile?.full_name || (user.user_metadata?.full_name as string | undefined) || ''

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs tracking-[0.4em] text-gold uppercase mb-2">Mi Cuenta</p>
          <h1 className="text-2xl font-light text-ivory tracking-wide">
            Hola{name ? `, ${name.split(' ')[0]}` : ''}
          </h1>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-smoke hover:text-red-500 transition-colors underline underline-offset-2">
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Orders */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-ivory uppercase tracking-wider">Mis pedidos</h2>

          {orders.length === 0 ? (
            <div className="bg-onyx-card border border-line rounded-2xl p-8 text-center">
              <p className="text-sm text-smoke mb-4">Aún no tienes pedidos con esta cuenta.</p>
              <Link href="/" className="inline-block px-6 py-2.5 bg-gold text-onyx text-xs font-medium tracking-widest uppercase rounded-full hover:bg-gold-deep transition-colors">
                Ver productos
              </Link>
            </div>
          ) : (
            orders.map((order) => {
              const status  = STATUS[order.status] ?? STATUS.pending
              const addr    = order.shipping_address as ShippingAddress
              const carrier = safeUrl(order.tracking_url)
              const trackHref = `/track?${new URLSearchParams({ order: order.id, email: addr.email }).toString()}`

              return (
                <article key={order.id} className="bg-onyx-card border border-line rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm text-ivory">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-smoke mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border ${status.className}`}>{status.label}</span>
                  </div>

                  <ul className="text-sm text-ivory space-y-1">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-4">
                        <span>{item.product_name} ({item.size_ml}ml) × {item.quantity}</span>
                        <span className="text-smoke whitespace-nowrap">{formatPrice(item.unit_price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-line pt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ivory">Total {formatPrice(Number(order.total))}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {order.tracking_number && (
                        <span className="text-smoke">Seguimiento: <span className="font-mono text-ivory">{order.tracking_number}</span></span>
                      )}
                      {carrier && (
                        <a href={carrier} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                          Seguir envío ↗
                        </a>
                      )}
                      <Link href={trackHref} className="text-gold hover:underline">Ver detalle</Link>
                    </div>
                  </div>
                </article>
              )
            })
          )}

          <p className="text-xs text-smoke">
            ¿Compraste sin iniciar sesión? Encuentra ese pedido en{' '}
            <Link href="/track" className="underline underline-offset-2 hover:text-gold">Rastrear Pedido</Link>.
          </p>
        </section>

        {/* Profile + password */}
        <aside className="space-y-6">
          <section className="bg-onyx-card border border-line rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ivory uppercase tracking-wider">Mis datos</h2>
            <ProfileForm email={user.email ?? ''} fullName={name} phone={profile?.phone ?? ''} />
          </section>
          <section className="bg-onyx-card border border-line rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ivory uppercase tracking-wider">Contraseña</h2>
            <PasswordForm />
          </section>
        </aside>
      </div>
    </div>
  )
}
