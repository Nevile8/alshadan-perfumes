'use client'

import { useTransition } from 'react'
import { deleteProduct } from '@/app/admin/actions'

export function DeleteButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('¿Eliminar este producto? Esta accion no se puede deshacer.')) return
    startTransition(async () => {
      await deleteProduct(productId)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isPending ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}