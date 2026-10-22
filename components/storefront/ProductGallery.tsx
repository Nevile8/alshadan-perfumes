'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ProductGalleryProps {
  name:     string
  coverUrl: string | null
  gallery:  string[]
}

/** Cover photo first, then the extra photos as thumbnails that swap the main image. */
export function ProductGallery({ name, coverUrl, gallery }: ProductGalleryProps) {
  const images = [coverUrl, ...gallery].filter((url): url is string => !!url)
  const [active, setActive] = useState(0)
  const current = images[active] ?? null

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-onyx-raised border border-line">
        {current ? (
          <Image
            src={current}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={active === 0}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <span className="text-6xl text-line-strong">◈</span>
            <span className="text-xs text-line-strong tracking-widest uppercase">Alshadan</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver foto ${i + 1} de ${name}`}
              aria-current={i === active}
              className={`relative shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 transition-colors
                ${i === active ? 'border-gold' : 'border-line hover:border-gold/50'}`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
