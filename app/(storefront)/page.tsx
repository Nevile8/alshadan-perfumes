import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FilterBar } from '@/components/storefront/FilterBar'
import { ProductCard } from '@/components/storefront/ProductCard'
import type { Product, ProductVariant } from '@/lib/types/database'

type ProductWithVariants = Product & { product_variants: ProductVariant[] }

// ── Helpers ──────────────────────────────────────────────────────────────────

function sortProducts(products: ProductWithVariants[], sort: string): ProductWithVariants[] {
  if (sort === 'price_asc') {
    return [...products].sort((a, b) => {
      const aMin = Math.min(...a.product_variants.map((v) => v.price))
      const bMin = Math.min(...b.product_variants.map((v) => v.price))
      return aMin - bMin
    })
  }
  if (sort === 'price_desc') {
    return [...products].sort((a, b) => {
      const aMin = Math.min(...a.product_variants.map((v) => v.price))
      const bMin = Math.min(...b.product_variants.map((v) => v.price))
      return bMin - aMin
    })
  }
  if (sort === 'newest') {
    return [...products].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }
  return products
}

// ── Page ─────────────────────────────────────────────────────────────────────

type PageParams = {
  searchParams: Promise<{
    gender?: string
    q?: string
    sort?: string
  }>
}

export default async function CatalogPage({ searchParams }: PageParams) {
  const params = await searchParams // Must await in Next.js 16

  const { gender, q, sort = '' } = params

  const supabase = await createClient()

  // Base query — always fetch with variants
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('products')
    .select('*, product_variants(*)')
    .eq('is_active', true)

  if (gender && ['hombre', 'mujer', 'unisex'].includes(gender)) {
    query = query.eq('gender', gender)
  }

  if (q && q.trim().length > 0) {
    query = query.or(`name.ilike.%${q.trim()}%,brand.ilike.%${q.trim()}%,description.ilike.%${q.trim()}%`)
  }

  const { data } = await query
  const rawProducts = (data ?? []) as ProductWithVariants[]
  const products = sortProducts(rawProducts, sort)

  const hasFilters = !!(gender || q)

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#F5E9D8] to-[#FAF3EB] py-12 px-4 text-center">
        <p className="text-xs tracking-[0.4em] text-[#D4A054] uppercase mb-3">Coleccion Exclusiva</p>
        <h1 className="text-4xl sm:text-5xl font-light text-[#2C221E] tracking-wide mb-4">
          Descubre tu Fragancia
        </h1>
        <p className="text-[#7A6E65] text-sm max-w-md mx-auto leading-relaxed">
          Perfumes de lujo para hombre, mujer y unisex. Aromas que cuentan tu historia.
        </p>
      </section>

      {/* Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* FilterBar — client component, needs Suspense for useSearchParams */}
        <Suspense fallback={<div className="h-14 animate-pulse" />}>
          <FilterBar />
        </Suspense>

        {/* Active search indicator */}
        {q && (
          <div className="flex items-center gap-2 mb-6 text-sm text-[#7A6E65]">
            <span>Resultados para</span>
            <span className="font-medium text-[#2C221E]">&ldquo;{q}&rdquo;</span>
            <span className="text-[#7A6E65]">— {products.length} producto{products.length !== 1 ? 's' : ''}</span>
            <Link
              href={gender ? `/?gender=${gender}` : '/'}
              className="ml-2 text-xs text-[#E86A33] hover:underline"
            >
              Limpiar busqueda
            </Link>
          </div>
        )}

        {/* Product grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#F0E8D8] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#D4A054]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h3 className="text-[#2C221E] font-medium mb-2">No se encontraron productos</h3>
            <p className="text-[#7A6E65] text-sm mb-6">
              {hasFilters
                ? 'Intenta con otros filtros o terminos de busqueda.'
                : 'Aun no hay productos disponibles.'}
            </p>
            {hasFilters && (
              <Link
                href="/"
                className="inline-block px-6 py-2.5 bg-[#E86A33] text-white text-xs font-medium
                           tracking-widest uppercase rounded-full hover:bg-[#d05a28] transition-colors"
              >
                Ver todos los productos
              </Link>
            )}
          </div>
        )}
      </section>
    </>
  )
}