import { Header } from '@/components/storefront/Header'
import { Footer } from '@/components/storefront/Footer'

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF3EB] text-[#2C221E] flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}