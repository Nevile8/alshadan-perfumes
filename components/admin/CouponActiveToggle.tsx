'use client'

import { useTransition } from 'react'
import { setCouponActive } from '@/app/admin/coupons/actions'

export function CouponActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (isActive && !confirm('¿Desactivar este cupón? Los clientes ya no podrán usarlo.')) return
    startTransition(async () => {
      const result = await setCouponActive(id, !isActive)
      if (result.error) alert(result.error)
    })
  }

  return (
    <button type="button" onClick={handleClick} disabled={isPending}
            className={`text-xs transition-colors disabled:opacity-40 ${isActive ? 'text-red-500 hover:text-red-300' : 'text-green-500 hover:text-green-300'}`}>
      {isPending ? '...' : isActive ? 'Desactivar' : 'Activar'}
    </button>
  )
}
