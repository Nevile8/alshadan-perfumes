import { Header } from '@/components/storefront/Header'
import { Footer } from '@/components/storefront/Footer'
import { CartProvider } from '@/components/storefront/CartProvider'

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="storefront-bg min-h-screen text-ink flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </CartProvider>
  )
}