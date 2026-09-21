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
  hombre: 'bg-blue-50 text-blue-700 border-blue-200',
  mujer:  'bg-rose-50 text-rose-700 border-rose-200',
  unisex: 'bg-amber-50 text-amber-700 border-amber-200',
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
      className="group bg-white border border-[#E8DEC8] rounded-xl overflow-hidden
                 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-[#FDF9F3] overflow-hidden">
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
            <svg className="w-12 h-12 text-[#E8DEC8]" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="text-xs text-[#E8DEC8] tracking-widest uppercase">Alshadan</span>
          </div>
        )}

        {/* Gender badge */}
        <span className={`absolute top-3 left-3 text-[10px] font-medium tracking-wider uppercase
                         px-2 py-0.5 rounded-full border ${GENDER_COLORS[product.gender] ?? 'bg-white text-gray-600 border-gray-200'}`}>
          {GENDER_LABEL[product.gender] ?? product.gender}
        </span>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[#2C221E]/0 group-hover:bg-[#2C221E]/10 transition-colors duration-300 flex items-end justify-center pb-4">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300
                           bg-[#E86A33] text-white text-xs font-medium tracking-widest uppercase
                           px-5 py-2 rounded-full">
            Ver Perfume
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1">
        <p className="text-xs text-[#7A6E65] uppercase tracking-widest">{product.brand}</p>
        <h3 className="text-[#2C221E] font-medium text-sm leading-tight line-clamp-2">{product.name}</h3>
        <p className="text-[#D4A054] font-semibold text-sm mt-1">{priceLabel}</p>
      </div>
    </Link>
  )
}