import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import { DeleteButton } from '@/components/admin/DeleteButton'
import type { Product, ProductVariant } from '@/lib/types/database'

type ProductWithVariants = Product & { product_variants: ProductVariant[] }

export default async function AdminProductsPage() {
  const supabase = createAdminClient()
  const { data: products } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .order('created_at', { ascending: false })

  const rows = (products ?? []) as ProductWithVariants[]

  const genderLabel: Record<string, string> = {
    hombre: 'Hombre',
    mujer: 'Mujer',
    unisex: 'Unisex',
  }

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
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-3 text-neutral-500 text-xs tracking-wider uppercase font-normal">Imagen</th>
                <th className="text-left px-4 py-3 text-neutral-500 text-xs tracking-wider uppercase font-normal">Nombre</th>
                <th className="text-left px-4 py-3 text-neutral-500 text-xs tracking-wider uppercase font-normal">Marca</th>
                <th className="text-left px-4 py-3 text-neutral-500 text-xs tracking-wider uppercase font-normal">Género</th>
                <th className="text-left px-4 py-3 text-neutral-500 text-xs tracking-wider uppercase font-normal">Variantes</th>
                <th className="text-left px-4 py-3 text-neutral-500 text-xs tracking-wider uppercase font-normal">Estado</th>
                <th className="text-right px-4 py-3 text-neutral-500 text-xs tracking-wider uppercase font-normal">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product, i) => (
                <tr
                  key={product.id}
                  className={`border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors ${
                    i === rows.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    {product.image_url ? (
                      <div className="w-10 h-10 rounded overflow-hidden bg-neutral-800 relative">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-neutral-800 flex items-center justify-center text-neutral-600 text-xs">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-light">{product.name}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{product.brand}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-neutral-700 text-neutral-400">
                      {genderLabel[product.gender]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {product.product_variants.length} variante{product.product_variants.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        product.is_active
                          ? 'bg-green-950/50 text-green-400 border border-green-900/50'
                          : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                      }`}
                    >
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-xs text-neutral-400 hover:text-white transition-colors"
                      >
                        Editar
                      </Link>
                      <DeleteButton productId={product.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
