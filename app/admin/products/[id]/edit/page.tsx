import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProductForm } from '@/components/admin/ProductForm'
import type { Product, ProductVariant } from '@/lib/types/database'

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

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light text-white tracking-wide">Editar Producto</h2>
        <p className="text-neutral-500 text-sm mt-1">{product.name}</p>
      </div>
      <ProductForm mode="edit" product={product} variants={product.product_variants} />
    </div>
  )
}