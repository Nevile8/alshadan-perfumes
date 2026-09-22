import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProductDetailClient } from '@/components/storefront/ProductDetailClient'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#7A6E65] mb-8">
        <Link href="/" className="hover:text-[#D4A054] transition-colors">Inicio</Link>
        <span>/</span>
        <Link href={`/?gender=${product.gender}`} className="hover:text-[#D4A054] transition-colors capitalize">
          {GENDER_LABEL[product.gender]}
        </Link>
        <span>/</span>
        <span className="text-[#2C221E]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* ── Left: Image ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#FDF9F3] border border-[#E8DEC8]">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <span className="text-6xl text-[#E8DEC8]">◈</span>
                <span className="text-xs text-[#E8DEC8] tracking-widest uppercase">Alshadan</span>
              </div>
            )}
          </div>

          {/* Olfactory notes visual display */}
          {product.olfactory_notes.length > 0 && (
            <div className="bg-[#FDF9F3] border border-[#E8DEC8] rounded-xl p-5">
              <p className="text-xs text-[#7A6E65] uppercase tracking-widest mb-3">Notas Olfativas</p>
              <div className="flex flex-wrap gap-2">
                {product.olfactory_notes.map((note: string) => (
                  <span
                    key={note}
                    className="px-3 py-1.5 bg-white border border-[#E8DEC8] rounded-full
                               text-xs text-[#2C221E] font-medium"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Info + Selectors ────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Brand + Name */}
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-[#D4A054] uppercase mb-2">
              {product.brand}
            </p>
            <h1 className="text-3xl sm:text-4xl font-light text-[#2C221E] leading-tight mb-3">
              {product.name}
            </h1>
            {/* Gender badge */}
            <span className="inline-block text-xs font-medium tracking-wider uppercase
                             px-3 py-1 rounded-full bg-[#F5E9D8] text-[#D4A054] border border-[#E8DEC8]">
              {GENDER_LABEL[product.gender]}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-[#7A6E65] leading-relaxed border-t border-[#E8DEC8] pt-5">
              {product.description}
            </p>
          )}

          {/* Client section: variant selector + add to cart */}
          <div className="border-t border-[#E8DEC8] pt-6">
            <Suspense fallback={<div className="h-32 animate-pulse bg-[#F0E8D8] rounded-xl" />}>
              <ProductDetailClient product={product} variants={variants} />
            </Suspense>
          </div>

          {/* Stock info */}
          <div className="flex items-center gap-2 text-xs text-[#7A6E65]">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
            En stock — envio a todo Chile
          </div>
        </div>
      </div>
    </div>
  )
}