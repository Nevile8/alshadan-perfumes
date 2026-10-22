'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { uploadProductImage } from '@/app/admin/actions'
import { LIMITS } from '@/lib/limits'

interface GalleryUploadProps {
  urls: string[]
  onChange: (urls: string[]) => void
  /** Swap this photo with the current cover image. */
  onMakeCover: (url: string) => void
}

export function GalleryUpload({ urls, onChange, onMakeCover }: GalleryUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const remaining = LIMITS.galleryCount - urls.length

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setUploading(true)

    const added: string[] = []
    for (const file of Array.from(files).slice(0, remaining)) {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadProductImage(formData)
      if (result.error) {
        setError(result.error)
        break
      }
      if (result.url) added.push(result.url)
    }
    if (files.length > remaining) setError(`Máximo ${LIMITS.galleryCount} fotos adicionales.`)

    if (added.length > 0) onChange([...urls, ...added])
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {urls.map((url) => (
          <div key={url} className="group relative aspect-square rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700">
            <Image src={url} alt="Foto adicional" fill className="object-cover" sizes="160px" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onMakeCover(url)}
                className="text-[11px] text-white border border-neutral-400 hover:border-white px-2 py-1 rounded"
              >
                Usar como portada
              </button>
              <button
                type="button"
                onClick={() => onChange(urls.filter((u) => u !== url))}
                className="text-[11px] text-red-300 hover:text-red-200"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-neutral-700 hover:border-neutral-500 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-500 text-xs transition-colors flex items-center justify-center text-center px-2 disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : '+ Agregar fotos'}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <p className="text-neutral-600 text-xs">
        Se muestran en la página del perfume. Hasta {LIMITS.galleryCount} fotos · JPG, PNG, WEBP · Máx. 5MB c/u
      </p>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
