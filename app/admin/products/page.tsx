import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProductsTable, type ProductRow } from '@/components/admin/ProductsTable'
import { profitMargin } from '@/lib/utils'
import type { Product, ProductVariant, ProductVariantCost } from '@/lib/types/database'

type ProductWithVariants = Product & { product_variants: ProductVariant[] }

export default async function AdminProductsPage() {
  const supabase = createAdminClient()
  const { data: products } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .order('created_at', { ascending: false })

  const rows = (products ?? []) as ProductWithVariants[]

  const { data: costRows } = await supabase.from('product_variant_costs').select('variant_id, cost')
  const costByVariant = new Map(
    ((costRows ?? []) as Pick<ProductVariantCost, 'variant_id' | 'cost'>[]).map((c) => [c.variant_id, Number(c.cost)])
  )

  /** Lowest–highest margin across the product's variants that have a cost, e.g. "32% – 41%". */
  function marginLabel(variants: ProductVariant[]): string | null {
    const margins = variants
      .map((v) => profitMargin(Number(v.price), costByVariant.get(v.id)))
      .filter((m): m is number => m != null)
    if (margins.length === 0) return null
    const min = Math.round(Math.min(...margins))
    const max = Math.round(Math.max(...margins))
    return min === max ? `${min}%` : `${min}% – ${max}%`
  }

  /** Lowest margin across variants with a cost, for sorting. */
  function minMargin(variants: ProductVariant[]): number | null {
    const margins = variants
      .map((v) => profitMargin(Number(v.price), costByVariant.get(v.id)))
      .filter((m): m is number => m != null)
    return margins.length ? Math.min(...margins) : null
  }

  // Only what the table shows goes to the browser (costs stay on the server)
  const tableRows: ProductRow[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    gender: p.gender,
    imageUrl: p.image_url,
    isActive: p.is_active,
    variants: [...p.product_variants]
      .sort((a, b) => a.size_ml - b.size_ml)
      .map((v) => ({ id: v.id, sizeMl: v.size_ml, price: Number(v.price), stock: v.stock })),
    marginLabel: marginLabel(p.product_variants),
    minMargin: minMargin(p.product_variants),
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light text-white tracking-wide">Productos</h2>
          <p className="text-neutral-500 text-sm mt-1">{rows.length} producto{rows.length !== 1 ? 's' : ''} en total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-white text-black text-xs font-medium tracking-widest uppercase rounded hover:bg-neutral-200 transition-colors"
        >
          + Nuevo Producto
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
          <p className="text-neutral-500 mb-4">No hay productos aún.</p>
          <Link
            href="/admin/products/seed"
            target="_blank"
            className="text-sm text-neutral-300 underline underline-offset-2 hover:text-white"
          >
            Cargar datos de prueba →
          </Link>
        </div>
      ) : (
        <ProductsTable rows={tableRows} />
      )}
    </div>
  )
}
