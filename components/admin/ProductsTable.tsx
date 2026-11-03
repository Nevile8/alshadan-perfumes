'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { StockEditor } from '@/components/admin/StockEditor'
import { formatPrice } from '@/lib/utils'

export interface ProductRow {
  id: string
  name: string
  brand: string
  gender: string
  imageUrl: string | null
  isActive: boolean
  /** Sorted by size, smallest first */
  variants: { id: string; sizeMl: number; price: number; stock: number }[]
  marginLabel: string | null
  /** Lowest margin, used for sorting */
  minMargin: number | null
}

type SortKey = 'name' | 'brand' | 'gender' | 'stock' | 'price' | 'margin' | 'status'
type Sort = { key: SortKey; dir: 'asc' | 'desc' } | null

const GENDER_LABEL: Record<string, string> = { hombre: 'Hombre', mujer: 'Mujer', unisex: 'Unisex' }

/** Lowercase without accents, so "colonia" finds "Colonía". */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const totalStock = (r: ProductRow) => r.variants.reduce((sum, v) => sum + v.stock, 0)
const minPrice = (r: ProductRow) => (r.variants.length ? Math.min(...r.variants.map((v) => v.price)) : null)

/** Value to sort by; null always goes last, whatever the direction. */
function sortValue(r: ProductRow, key: SortKey): string | number | null {
  switch (key) {
    case 'name':   return r.name
    case 'brand':  return r.brand
    case 'gender': return GENDER_LABEL[r.gender] ?? r.gender
    case 'stock':  return r.variants.length ? totalStock(r) : null
    case 'price':  return minPrice(r)
    case 'margin': return r.minMargin
    case 'status': return r.isActive ? 1 : 0
  }
}

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true })

export function ProductsTable({ rows }: { rows: ProductRow[] }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>(null)

  const visible = useMemo(() => {
    const q = normalize(query.trim())
    const filtered = q ? rows.filter((r) => normalize(r.name).includes(q)) : rows
    if (!sort) return filtered
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const va = sortValue(a, sort.key)
      const vb = sortValue(b, sort.key)
      if (va == null || vb == null) return va == null ? (vb == null ? 0 : 1) : -1
      const cmp = typeof va === 'string' ? collator.compare(va, vb as string) : va - (vb as number)
      return cmp * factor || collator.compare(a.name, b.name)
    })
  }, [rows, query, sort])

  function toggle(key: SortKey) {
    setSort((s) => {
      if (s?.key !== key) return { key, dir: 'asc' }
      if (s.dir === 'asc') return { key, dir: 'desc' }
      return null // third click: back to newest first
    })
  }

  const thBase = 'px-4 py-3 text-neutral-500 text-xs tracking-wider uppercase font-normal'

  function sortableTh(k: SortKey, label: string) {
    const active = sort?.key === k
    return (
      <th key={k} className={`text-left ${thBase}`} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button
          type="button"
          onClick={() => toggle(k)}
          className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-white transition-colors ${active ? 'text-white' : ''}`}
        >
          {label}
          <span aria-hidden className={active ? '' : 'opacity-30'}>
            {active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </button>
      </th>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre…"
          aria-label="Buscar producto por nombre"
          maxLength={80}
          className="w-full max-w-sm px-3 py-2 rounded bg-neutral-900 border border-neutral-800 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
        />
        {query.trim() && (
          <span className="text-xs text-neutral-500">
            {visible.length} de {rows.length}
          </span>
        )}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className={`text-left ${thBase}`}>Imagen</th>
              {sortableTh('name', 'Nombre')}
              {sortableTh('brand', 'Marca')}
              {sortableTh('gender', 'Género')}
              {sortableTh('stock', 'Inventario')}
              {sortableTh('price', 'Precio')}
              {sortableTh('margin', 'Margen')}
              {sortableTh('status', 'Estado')}
              <th className={`text-right ${thBase}`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-neutral-500">
                  Ningún producto coincide con “{query.trim()}”.
                </td>
              </tr>
            )}
            {visible.map((product, i) => (
              <tr
                key={product.id}
                className={`border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors align-top ${
                  i === visible.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <td className="px-4 py-3">
                  {product.imageUrl ? (
                    <div className="w-10 h-10 rounded overflow-hidden bg-neutral-800 relative">
                      <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="40px" />
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
                    {GENDER_LABEL[product.gender] ?? product.gender}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {product.variants.length === 0 ? (
                    <span className="text-neutral-600 text-xs">Sin variantes</span>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {product.variants.map((v) => (
                        <StockEditor key={v.id} variantId={v.id} sizeMl={v.sizeMl} stock={v.stock} />
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {product.variants.length === 0 ? (
                    <span className="text-neutral-600 text-xs">—</span>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {product.variants.map((v) => (
                        <span key={v.id} className="h-6 flex items-center gap-2 text-xs tabular-nums whitespace-nowrap">
                          <span className="text-neutral-500 w-12">{v.sizeMl} ml</span>
                          <span className="text-neutral-300">{formatPrice(v.price)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-400 tabular-nums">
                  {product.marginLabel ?? <span className="text-neutral-600">Sin costo</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      product.isActive
                        ? 'bg-green-950/50 text-green-400 border border-green-900/50'
                        : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                    }`}
                  >
                    {product.isActive ? 'Activo' : 'Inactivo'}
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
    </div>
  )
}
