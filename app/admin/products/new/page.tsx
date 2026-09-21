import { ProductForm } from '@/components/admin/ProductForm'

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light text-white tracking-wide">Nuevo Producto</h2>
        <p className="text-neutral-500 text-sm mt-1">Agrega un nuevo perfume al catalogo</p>
      </div>
      <ProductForm mode="create" />
    </div>
  )
}