import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProductForm } from '@/components/admin/ProductForm'
import type { Product, ProductVariant, ProductVariantCost } from '@/lib/types/database'

type PageProps = { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const product = data as Product & { product_variants: ProductVariant[] }

  const { data: costRows } = await supabase
    .from('product_variant_costs')
    .select('variant_id, cost')
    .in('variant_id', product.product_variants.map((v) => v.id))
  const costs = Object.fromEntries(
    ((costRows ?? []) as Pick<ProductVariantCost, 'variant_id' | 'cost'>[]).map((c) => [c.variant_id, Number(c.cost)])
  )

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light text-white tracking-wide">Editar Producto</h2>
        <p className="text-neutral-500 text-sm mt-1">{product.name}</p>
      </div>
      <ProductForm mode="edit" product={product} variants={product.product_variants} costs={costs} />
    </div>
  )
}