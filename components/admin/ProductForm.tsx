'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TagInput } from './TagInput'
import { ImageUpload } from './ImageUpload'
import { createProduct, updateProduct } from '@/app/admin/actions'
import type { Product, ProductVariant, ProductGender } from '@/lib/types/database'

interface VariantRow {
  id?: string
  size_ml: string
  price: string
  stock: string
  sku: string
}

interface ProductFormProps {
  mode: 'create' | 'edit'
  product?: Product
  variants?: ProductVariant[]
}

const GENDER_OPTIONS: { value: ProductGender; label: string }[] = [
  { value: 'hombre', label: 'Hombre' },
  { value: 'mujer', label: 'Mujer' },
  { value: 'unisex', label: 'Unisex' },
]

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function ProductForm({ mode, product, variants = [] }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [name, setName] = useState(product?.name ?? '')
  const [brand, setBrand] = useState(product?.brand ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugManual, setSlugManual] = useState(false)
  const [gender, setGender] = useState<ProductGender>(product?.gender ?? 'unisex')
  const [description, setDescription] = useState(product?.description ?? '')
  const [notes, setNotes] = useState<string[]>(product?.olfactory_notes ?? [])
  const [imageUrl, setImageUrl] = useState<string>(product?.image_url ?? '')
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [error, setError] = useState<string | null>(null)

  // Variants state
  const [variantRows, setVariantRows] = useState<VariantRow[]>(
    variants.length > 0
      ? variants.map((v) => ({
          id: v.id,
          size_ml: String(v.size_ml),
          price: String(v.price),
          stock: String(v.stock),
          sku: v.sku ?? '',
        }))
      : [{ size_ml: '', price: '', stock: '', sku: '' }]
  )
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([])

  function handleNameChange(val: string) {
    setName(val)
    if (!slugManual) setSlug(slugify(val))
  }

  function addVariant() {
    setVariantRows((rows) => [...rows, { size_ml: '', price: '', stock: '', sku: '' }])
  }

  function removeVariant(index: number) {
    const row = variantRows[index]
    if (row.id) setDeletedVariantIds((ids) => [...ids, row.id!])
    setVariantRows((rows) => rows.filter((_, i) => i !== index))
  }

  function updateVariant(index: number, field: keyof VariantRow, value: string) {
    setVariantRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate variants
    for (const v of variantRows) {
      if (!v.size_ml || !v.price || v.stock === '') {
        setError('Todas las variantes deben tener tamaño, precio y stock.')
        return
      }
    }

    const payload = {
      name,
      brand,
      slug,
      gender,
      description,
      olfactory_notes: notes,
      image_url: imageUrl || undefined,
      is_active: isActive,
      variants: variantRows.map((v) => ({
        id: v.id,
        size_ml: parseInt(v.size_ml),
        price: parseFloat(v.price),
        stock: parseInt(v.stock),
        sku: v.sku || undefined,
      })),
    }

    startTransition(async () => {
      let result: { error: string | null }
      if (mode === 'create') {
        result = await createProduct(payload)
      } else {
        result = await updateProduct(product!.id, payload, deletedVariantIds)
      }
      if (result?.error) setError(result.error)
    })
  }

  const inputClass =
    'w-full bg-neutral-800 border border-neutral-700 rounded px-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors'
  const labelClass = 'block text-xs text-neutral-400 tracking-wider uppercase mb-2'

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Basic Info */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-5">
        <h3 className="text-sm text-neutral-300 tracking-wider uppercase">Información Básica</h3>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Nombre del Perfume</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="Royal Oud"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Marca</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
              placeholder="Alshadan"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Slug URL</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }}
              placeholder="royal-oud"
              className={inputClass}
            />
            <p className="text-neutral-600 text-xs mt-1">Auto-generado desde el nombre</p>
          </div>
          <div>
            <label className={labelClass}>Género</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as ProductGender)}
              className={inputClass}
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe el perfume..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? 'bg-white' : 'bg-neutral-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                isActive ? 'translate-x-6 bg-black' : 'translate-x-1 bg-neutral-400'
              }`}
            />
          </button>
          <label className="text-sm text-neutral-300">
            Producto {isActive ? 'activo' : 'inactivo'}
          </label>
        </div>
      </section>

      {/* Image */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
        <h3 className="text-sm text-neutral-300 tracking-wider uppercase">Imagen del Producto</h3>
        <ImageUpload currentUrl={imageUrl || null} onUpload={(url) => setImageUrl(url)} />
      </section>

      {/* Olfactory Notes */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
        <h3 className="text-sm text-neutral-300 tracking-wider uppercase">Notas Olfativas</h3>
        <p className="text-neutral-500 text-xs">Escribe una nota y presiona Enter para agregarla.</p>
        <TagInput value={notes} onChange={setNotes} placeholder="Rosa, Sándalo, Ámbar..." />
      </section>

      {/* Variants */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm text-neutral-300 tracking-wider uppercase">Variantes</h3>
          <button
            type="button"
            onClick={addVariant}
            className="text-xs text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 px-3 py-1.5 rounded transition-colors"
          >
            + Agregar variante
          </button>
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 text-xs text-neutral-600 uppercase tracking-wider px-1">
            <span className="col-span-3">Tamaño (ml)</span>
            <span className="col-span-3">Precio (CLP)</span>
            <span className="col-span-2">Stock</span>
            <span className="col-span-3">SKU</span>
            <span className="col-span-1" />
          </div>

          {variantRows.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center">
              <input
                type="number"
                value={row.size_ml}
                onChange={(e) => updateVariant(i, 'size_ml', e.target.value)}
                placeholder="100"
                min="1"
                className={`col-span-3 ${inputClass} py-2`}
              />
              <input
                type="number"
                value={row.price}
                onChange={(e) => updateVariant(i, 'price', e.target.value)}
                placeholder="79900"
                min="0"
                step="100"
                className={`col-span-3 ${inputClass} py-2`}
              />
              <input
                type="number"
                value={row.stock}
                onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                placeholder="0"
                min="0"
                className={`col-span-2 ${inputClass} py-2`}
              />
              <input
                type="text"
                value={row.sku}
                onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                placeholder="RO-100"
                className={`col-span-3 ${inputClass} py-2`}
              />
              <button
                type="button"
                onClick={() => removeVariant(i)}
                disabled={variantRows.length === 1}
                className="col-span-1 text-neutral-600 hover:text-red-400 transition-colors text-lg disabled:opacity-20 disabled:cursor-not-allowed text-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm py-3 px-4 bg-red-950/30 border border-red-900/50 rounded">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-3 bg-white text-black text-sm font-medium tracking-widest uppercase rounded hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? mode === 'create' ? 'Creando...' : 'Guardando...'
            : mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="px-6 py-3 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 text-sm rounded transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}