import { CouponForm } from '@/components/admin/CouponForm'

export default function NewCouponPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light text-white tracking-wide">Nuevo cupón</h2>
        <p className="text-neutral-500 text-sm mt-1">Los clientes lo ingresan en el carrito o al pagar.</p>
      </div>
      <CouponForm />
    </div>
  )
}
