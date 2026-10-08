import { Suspense } from 'react'
import { TrackOrderClient } from '@/components/storefront/TrackOrderClient'

export const metadata = { title: 'Rastrear Pedido — ALSHADAN' }

export default function TrackOrderPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <p className="text-xs tracking-[0.4em] text-[#D4A054] uppercase mb-3">Seguimiento</p>
        <h1 className="text-3xl font-light text-[#2C221E] tracking-wide mb-3">Rastrear Pedido</h1>
        <p className="text-sm text-[#7A6E65] max-w-sm mx-auto">
          Ingresa el número de orden y el correo electrónico utilizado al comprar.
        </p>
      </div>
      <Suspense>
        <TrackOrderClient />
      </Suspense>
    </div>
  )
}