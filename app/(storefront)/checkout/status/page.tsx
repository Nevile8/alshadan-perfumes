import Link from 'next/link'
import { ClearCartClient } from './ClearCartClient'

type Props = {
  searchParams: Promise<{
    status?: string
    external_reference?: string
    payment_id?: string
  }>
}

export default async function CheckoutStatusPage({ searchParams }: Props) {
  const { status, external_reference } = await searchParams

  const isSuccess = status === 'approved'
  const isPending = status === 'in_process' || status === 'pending'

  let title = 'Pago no completado'
  let message = 'Hubo un problema procesando tu pago o fue cancelado.'
  let icon = (
    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  )

  if (isSuccess) {
    title = '¡Pago Exitoso!'
    message = 'Tu pedido ha sido confirmado y el pago procesado correctamente.'
    icon = (
      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
      </svg>
    )
  } else if (isPending) {
    title = 'Pago en Proceso'
    message = 'Tu pago está siendo validado. Te notificaremos en breve.'
    icon = (
      <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/>
        <circle cx="12" cy="12" r="10" stroke="currentColor"/>
      </svg>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      {/* If successful, this component clears the localStorage cart */}
      {isSuccess && <ClearCartClient />}

      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
        isSuccess ? 'bg-green-900/40' : isPending ? 'bg-yellow-900/40' : 'bg-red-900/40'
      }`}>
        {icon}
      </div>

      <h1 className="text-2xl font-light text-ivory mb-3 tracking-wide">{title}</h1>
      
      {external_reference && (
        <p className="text-smoke text-sm mb-2">
          Orden <strong className="text-ivory font-mono">#{external_reference.slice(0, 8).toUpperCase()}</strong>
        </p>
      )}

      <p className="text-smoke text-sm mb-8">{message}</p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {isSuccess || isPending ? (
          <Link
            href="/track"
            className="px-8 py-3 bg-gold text-onyx text-sm font-medium
                       tracking-widest uppercase rounded-full hover:bg-gold-deep transition-colors"
          >
            Rastrear Pedido
          </Link>
        ) : null}
        
        <Link
          href="/"
          className={`px-8 py-3 text-sm font-medium tracking-widest uppercase rounded-full transition-colors ${
            isSuccess || isPending
              ? 'bg-onyx-raised text-ivory hover:bg-line'
              : 'bg-gold text-onyx hover:bg-gold-deep'
          }`}
        >
          {isSuccess || isPending ? 'Volver a la Tienda' : 'Intentar de Nuevo'}
        </Link>
      </div>
    </div>
  )
}