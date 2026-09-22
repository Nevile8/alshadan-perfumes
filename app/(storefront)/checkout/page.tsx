import { Suspense } from 'react'
import { getShippingData } from './actions'
import { CheckoutForm } from '@/components/storefront/CheckoutForm'

export default async function CheckoutPage() {
  const { communes, surchargePercent } = await getShippingData()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-[#2C221E] tracking-wide">Finalizar Compra</h1>
        <p className="text-sm text-[#7A6E65] mt-1">Completa tus datos de envio y pago.</p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse bg-[#F0E8D8] rounded-2xl" />}>
        <CheckoutForm communes={communes} surchargePercent={surchargePercent} />
      </Suspense>
    </div>
  )
}