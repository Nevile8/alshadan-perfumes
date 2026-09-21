'use client'

import Image from 'next/image'
import { useRef, useState, DragEvent } from 'react'
import { uploadProductImage } from '@/app/admin/actions'

interface ImageUploadProps {
  currentUrl?: string | null
  onUpload: (url: string) => void
}

export function ImageUpload({ currentUrl, onUpload }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    setError(null)
    setUploading(true)

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    const formData = new FormData()
    formData.append('file', file)

    const result = await uploadProductImage(formData)

    if (result.error) {
      setError(result.error)
      setPreview(currentUrl ?? null)
    } else if (result.url) {
      onUpload(result.url)
      URL.revokeObjectURL(objectUrl)
      setPreview(result.url)
    }
    setUploading(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) processFile(file)
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors overflow-hidden
          ${isDragging ? 'border-neutral-400 bg-neutral-800' : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-500 hover:bg-neutral-800'}`}
      >
        {preview ? (
          <>
            <Image src={preview} alt="Preview" fill className="object-cover" sizes="400px" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-sm">Cambiar imagen</span>
            </div>
          </>
        ) : (
          <div className="text-center pointer-events-none">
            <p className="text-neutral-500 text-sm">
              {uploading ? 'Subiendo...' : 'Arrastra una imagen o haz clic para seleccionar'}
            </p>
            <p className="text-neutral-600 text-xs mt-1">JPG, PNG, WEBP · Máx. 5MB</p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}