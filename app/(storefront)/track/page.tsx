import { Suspense } from 'react'
import { TrackOrderClient } from '@/components/storefront/TrackOrderClient'

export const metadata = { title: 'Rastrear Pedido — ALSHADAN' }

export default function TrackOrderPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <p className="text-xs tracking-[0.4em] text-gold uppercase mb-3">Seguimiento</p>
        <h1 className="text-3xl font-light text-ivory tracking-wide mb-3">Rastrear Pedido</h1>
        <p className="text-sm text-smoke max-w-sm mx-auto">
          Ingresa el número de orden (los 8 caracteres después del #) y el correo electrónico utilizado al comprar.
        </p>
      </div>
      <Suspense>
        <TrackOrderClient />
      </Suspense>
    </div>
  )
}