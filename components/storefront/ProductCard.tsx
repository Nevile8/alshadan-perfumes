import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { Product, ProductVariant } from '@/lib/types/database'

type ProductWithVariants = Product & { product_variants: ProductVariant[] }

const GENDER_LABEL: Record<string, string> = {
  hombre: 'Hombre',
  mujer:  'Mujer',
  unisex: 'Unisex',
}

const GENDER_COLORS: Record<string, string> = {
  hombre: 'bg-blue-950/40 text-blue-300 border-blue-800/60',
  mujer:  'bg-rose-950/40 text-rose-300 border-rose-800/60',
  unisex: 'bg-amber-950/40 text-amber-300 border-amber-800/60',
}

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const variants = product.product_variants
  const prices   = variants.map((v) => v.price).sort((a, b) => a - b)
  const minPrice = prices[0]
  const priceLabel = prices.length > 1
    ? `Desde ${formatPrice(minPrice)}`
    : minPrice != null ? formatPrice(minPrice) : 'Consultar'

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group bg-onyx-card border border-line rounded-xl overflow-hidden
                 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-onyx-raised overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          /* Placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <svg className="w-12 h-12 text-line-strong" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="text-xs text-line-strong tracking-widest uppercase">Alshadan</span>
          </div>
        )}

        {/* Gender badge */}
        <span className={`absolute top-3 left-3 text-[10px] font-medium tracking-wider uppercase
                         px-2 py-0.5 rounded-full border ${GENDER_COLORS[product.gender] ?? 'bg-onyx-card text-gray-400 border-gray-800/60'}`}>
          {GENDER_LABEL[product.gender] ?? product.gender}
        </span>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end justify-center pb-4">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300
                           bg-gold text-onyx text-xs font-medium tracking-widest uppercase
                           px-5 py-2 rounded-full">
            Ver Perfume
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1">
        <p className="text-xs text-smoke uppercase tracking-widest">{product.brand}</p>
        <h3 className="text-ivory font-medium text-sm leading-tight line-clamp-2">{product.name}</h3>
        <p className="text-gold font-semibold text-sm mt-1">{priceLabel}</p>
      </div>
    </Link>
  )
}