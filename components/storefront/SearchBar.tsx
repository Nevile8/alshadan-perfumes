'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

export function SearchBar() {
  const searchParams = useSearchParams()
  const pathname     = usePathname()
  const { replace }  = useRouter()

  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateURL = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (term) {
        params.set('q', term)
      } else {
        params.delete('q')
      }
      replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, replace]
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const term = e.target.value
    setValue(term)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateURL(term), 300)
  }

  function handleClear() {
    setValue('')
    updateURL('')
  }

  // Sync if URL q param changes externally (e.g. FilterBar clearing)
  useEffect(() => {
    setValue(searchParams.get('q') ?? '')
  }, [searchParams])

  return (
    <div className="relative flex items-center w-full max-w-md">
      {/* Search icon */}
      <svg
        className="absolute left-3 w-4 h-4 text-[#7A6E65] pointer-events-none"
        fill="none" stroke="currentColor" strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Buscar perfumes..."
        className="w-full pl-9 pr-8 py-2 text-sm bg-[#FDF9F3] border border-[#E8DEC8] rounded-full
                   text-[#2C221E] placeholder-[#7A6E65] focus:outline-none focus:border-[#D4A054]
                   transition-colors"
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 text-[#7A6E65] hover:text-[#2C221E] transition-colors"
          aria-label="Limpiar búsqueda"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}