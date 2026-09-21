'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

const GENDER_FILTERS = [
  { label: 'Destacado', value: '' },
  { label: 'Hombre',    value: 'hombre' },
  { label: 'Mujer',     value: 'mujer' },
  { label: 'Unisex',   value: 'unisex' },
]

const SORT_OPTIONS = [
  { label: 'Destacados',              value: '' },
  { label: 'Precio: Menor a Mayor',   value: 'price_asc' },
  { label: 'Precio: Mayor a Menor',   value: 'price_desc' },
  { label: 'Mas recientes',           value: 'newest' },
]

export function FilterBar() {
  const searchParams = useSearchParams()
  const pathname     = usePathname()
  const { replace }  = useRouter()

  const activeGender = searchParams.get('gender') ?? ''
  const activeSort   = searchParams.get('sort')   ?? ''

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, replace]
  )

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4">
      {/* Gender pills */}
      <div className="flex flex-wrap gap-2">
        {GENDER_FILTERS.map((f) => {
          const isActive = activeGender === f.value
          return (
            <button
              key={f.value}
              onClick={() => setParam('gender', f.value)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                isActive
                  ? 'bg-[#D4A054] border-[#D4A054] text-white shadow-sm'
                  : 'bg-white border-[#E8DEC8] text-[#7A6E65] hover:border-[#D4A054] hover:text-[#2C221E]'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-xs text-[#7A6E65] uppercase tracking-wider whitespace-nowrap">
          Ordenar:
        </label>
        <select
          id="sort"
          value={activeSort}
          onChange={(e) => setParam('sort', e.target.value)}
          className="text-sm bg-white border border-[#E8DEC8] text-[#2C221E] rounded-lg px-3 py-1.5
                     focus:outline-none focus:border-[#D4A054] transition-colors cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}