import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProductDetailClient } from '@/components/storefront/ProductDetailClient'
import { ProductGallery } from '@/components/storefront/ProductGallery'
import { availableSizes } from '@/lib/utils'
import type { Product, ProductVariant } from '@/lib/types/database'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('products')
    .select('name, brand, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!data) return { title: 'Producto no encontrado' }
  return {
    title: `${data.name} — ${data.brand}`,
    description: data.description ?? undefined,
  }
}

const GENDER_LABEL: Record<string, string> = {
  hombre: 'Hombre',
  mujer:  'Mujer',
  unisex: 'Unisex',
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('products')
    .select('*, product_variants(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!data) notFound()

  const product  = data as Product & { product_variants: ProductVariant[] }
  const variants = [...product.product_variants].sort((a, b) => a.size_ml - b.size_ml)
  const sizes    = availableSizes(variants)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ink/75 mb-8">
        <Link href="/" className="hover:text-accent transition-colors">Inicio</Link>
        <span>/</span>
        <Link href={`/?gender=${product.gender}`} className="hover:text-accent transition-colors capitalize">
          {GENDER_LABEL[product.gender]}
        </Link>
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* ── Left: Image ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          <ProductGallery
            name={product.name}
            coverUrl={product.image_url}
            gallery={product.gallery_urls ?? []}
          />

          {/* Olfactory notes visual display */}
          {product.olfactory_notes.length > 0 && (
            <div className="bg-surface/95 border border-line rounded-xl p-5 backdrop-blur-sm">
              <p className="text-xs text-accent uppercase tracking-widest mb-3">Notas Olfativas</p>
              <div className="flex flex-wrap gap-2">
                {product.olfactory_notes.map((note: string) => (
                  <span
                    key={note}
                    className="px-3 py-1.5 bg-surface border border-line rounded-full
                               text-xs text-ink font-medium"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Info + Selectors ────────────────────────────────────── */}
        <div className="self-start space-y-6 rounded-2xl border border-line bg-surface/95
                        p-6 sm:p-8 shadow-2xl shadow-black/10 backdrop-blur-sm">
          {/* Brand + Name */}
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase mb-2">
              {product.brand}
            </p>
            <h1 className="text-3xl sm:text-4xl font-light text-ink leading-tight mb-3">
              {product.name}
            </h1>
            {/* Gender badge */}
            <span className="inline-block text-xs font-medium tracking-wider uppercase
                             px-3 py-1 rounded-full bg-surface-2 text-accent border border-line">
              {GENDER_LABEL[product.gender]}
            </span>
            <p className="mt-3 text-sm text-ink/85">
              {sizes.length > 0
                ? <>Disponible en <span className="text-accent font-medium">{sizes.map((ml) => `${ml} ml`).join(' · ')}</span></>
                : 'Sin stock por el momento'}
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-[15px] text-ink/85 leading-relaxed border-t border-line pt-5">
              {product.description}
            </p>
          )}

          {/* Client section: variant selector + add to cart */}
          <div className="border-t border-line pt-6">
            <Suspense fallback={<div className="h-32 animate-pulse bg-surface-2 rounded-xl" />}>
              <ProductDetailClient product={product} variants={variants} />
            </Suspense>
          </div>

          {/* Stock info */}
          <div className="flex items-center gap-2 text-xs text-ink/80">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
            En stock — envio a todo Chile
          </div>
        </div>
      </div>
    </div>
  )
}