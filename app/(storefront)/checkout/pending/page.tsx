import Link from 'next/link'

type PageProps = { searchParams: Promise<{ order?: string }> }

export default async function CheckoutPendingPage({ searchParams }: PageProps) {
  const { order } = await searchParams

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-6">
        <svg className="w-9 h-9 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </div>
      <h1 className="text-2xl font-light text-ink mb-3 tracking-wide">Pedido Recibido</h1>
      <p className="text-muted text-sm mb-2">
        Tu orden <strong className="text-ink">#{order?.slice(0, 8).toUpperCase()}</strong> fue creada correctamente.
      </p>
      <p className="text-muted text-sm mb-8">
        La integración de pagos (Mercado Pago / Webpay) se completará en la siguiente fase.
        Recibirás un correo de confirmación cuando el pago sea procesado.
      </p>
      <Link
        href="/"
        className="inline-block px-8 py-3 bg-accent text-page text-sm font-medium
                   tracking-widest uppercase rounded-full hover:bg-accent-deep transition-colors"
      >
        Volver a la Tienda
      </Link>
    </div>
  )
}