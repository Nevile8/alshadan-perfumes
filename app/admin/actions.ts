'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { LIMITS, UUID_RE, cleanString } from '@/lib/limits'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

export async function uploadProductImage(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  await requireAdmin()
  const supabase = createAdminClient()
  const file = formData.get('file') as File | null

  if (!file || file.size === 0) return { url: null, error: 'No file provided' }

  if (typeof file === 'string') return { url: null, error: 'No file provided' }
  if (file.size > 5 * 1024 * 1024) return { url: null, error: 'El archivo supera 5MB.' }

  // Trust the file's bytes, not its name or declared type: an "image" that is
  // really HTML or SVG would be served from our storage domain.
  const arrayBuffer = await file.arrayBuffer()
  const ext = detectImageType(new Uint8Array(arrayBuffer))
  if (!ext) return { url: null, error: 'Formato no permitido. Usa JPG, PNG, WEBP o AVIF.' }

  const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('Perfume')
    .upload(fileName, arrayBuffer, { contentType: IMAGE_MIME[ext], upsert: false })

  if (uploadError) {
    console.error('[Admin] Image upload failed', uploadError)
    return { url: null, error: 'No se pudo subir la imagen.' }
  }

  const { data } = supabase.storage.from('Perfume').getPublicUrl(fileName)
  return { url: data.publicUrl, error: null }
}

export async function deleteProductImage(path: string): Promise<void> {
  await requireAdmin()
  const supabase = createAdminClient()
  if (typeof path !== 'string') return
  const filePath = path.split('/storage/v1/object/public/Perfume/')[1]
  // Only ever delete product images, never other files in the bucket
  if (filePath && /^products\/[\w.-]+$/.test(filePath)) {
    await supabase.storage.from('Perfume').remove([filePath])
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IMAGE_MIME = {
  jpg:  'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
} as const

type ImageExt = keyof typeof IMAGE_MIME

/** Identifies the image format from its first bytes ("magic numbers"). */
function detectImageType(bytes: Uint8Array): ImageExt | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end))
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg'
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'png'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) return 'avif'
  return null
}

const GENDERS = ['hombre', 'mujer', 'unisex'] as const
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/

/** Images must come from our own Supabase storage bucket (see uploadProductImage). */
function isOwnImageUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return false
  return url.startsWith(`${base.replace(/\/$/, '')}/storage/v1/object/public/Perfume/`)
}

function isIntInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

/** Admin actions are public endpoints too: check every field, whatever the form sent. */
function validateProduct(data: ProductInput): { product: ProductInput | null; error: string | null } {
  if (!data || typeof data !== 'object') return { product: null, error: 'Datos inválidos.' }

  const name        = cleanString(data.name, LIMITS.productName)
  const brand       = cleanString(data.brand, LIMITS.brand)
  const description = cleanString(data.description ?? '', LIMITS.description)
  const imageUrl    = cleanString(data.image_url ?? '', 500)

  if (!name)  return { product: null, error: `El nombre es obligatorio (máximo ${LIMITS.productName} caracteres).` }
  if (!brand) return { product: null, error: `La marca es obligatoria (máximo ${LIMITS.brand} caracteres).` }
  if (description === null) return { product: null, error: `La descripción admite máximo ${LIMITS.description} caracteres.` }
  if (!GENDERS.includes(data.gender)) return { product: null, error: 'Género no válido.' }
  if (typeof data.is_active !== 'boolean') return { product: null, error: 'Datos inválidos.' }
  if (imageUrl === null || (imageUrl && !isOwnImageUrl(imageUrl))) return { product: null, error: 'La imagen debe subirse desde este panel.' }

  const rawGallery = data.gallery_urls ?? []
  if (!Array.isArray(rawGallery) || rawGallery.length > LIMITS.galleryCount)
    return { product: null, error: `Máximo ${LIMITS.galleryCount} fotos adicionales.` }
  const gallery: string[] = []
  for (const url of rawGallery) {
    const clean = cleanString(url, 500)
    if (!clean || !isOwnImageUrl(clean)) return { product: null, error: 'Las fotos deben subirse desde este panel.' }
    if (clean !== imageUrl && !gallery.includes(clean)) gallery.push(clean)
  }

  const slug = cleanString(data.slug ?? '', LIMITS.slug) || generateSlug(name).slice(0, LIMITS.slug)
  if (!SLUG_RE.test(slug)) return { product: null, error: 'El slug solo puede tener minúsculas, números y guiones.' }

  if (!Array.isArray(data.olfactory_notes) || data.olfactory_notes.length > LIMITS.notesCount)
    return { product: null, error: `Máximo ${LIMITS.notesCount} notas olfativas.` }
  const notes: string[] = []
  for (const note of data.olfactory_notes) {
    const clean = cleanString(note, LIMITS.noteLength)
    if (!clean) return { product: null, error: `Cada nota olfativa admite máximo ${LIMITS.noteLength} caracteres.` }
    notes.push(clean)
  }

  if (!Array.isArray(data.variants) || data.variants.length > LIMITS.variantsCount)
    return { product: null, error: `Máximo ${LIMITS.variantsCount} variantes.` }
  const variants: VariantInput[] = []
  for (const v of data.variants) {
    const sku = cleanString(v?.sku ?? '', LIMITS.sku)
    if (
      !v || typeof v !== 'object' ||
      (v.id !== undefined && (typeof v.id !== 'string' || !UUID_RE.test(v.id))) ||
      !isIntInRange(v.size_ml, 1, 10_000) ||
      !isIntInRange(v.stock, 0, 100_000) ||
      typeof v.price !== 'number' || !Number.isFinite(v.price) || v.price < 0 || v.price > 100_000_000 ||
      (v.cost != null && (typeof v.cost !== 'number' || !Number.isFinite(v.cost) || v.cost < 0 || v.cost > 100_000_000)) ||
      sku === null
    ) {
      return { product: null, error: 'Revisa las variantes: tamaño, precio, costo y stock deben ser números válidos y el SKU máximo de 40 caracteres.' }
    }
    variants.push({ id: v.id, size_ml: v.size_ml, price: v.price, cost: v.cost ?? null, stock: v.stock, sku: sku || undefined })
  }

  return {
    product: {
      name, brand, slug, description,
      gender: data.gender,
      olfactory_notes: notes,
      image_url: imageUrl || undefined,
      gallery_urls: gallery,
      is_active: data.is_active,
      variants,
    },
    error: null,
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VariantInput {
  id?: string
  size_ml: number
  price: number
  cost?: number | null  // purchase cost, admin only (product_variant_costs)
  stock: number
  sku?: string
}

export interface ProductInput {
  name: string
  brand: string
  slug?: string
  gender: 'hombre' | 'mujer' | 'unisex'
  description?: string
  olfactory_notes: string[]
  image_url?: string
  gallery_urls?: string[]
  is_active: boolean
  variants: VariantInput[]
}

/** Saves or clears the purchase cost of one variant. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveVariantCost(supabase: any, variantId: string, cost: number | null | undefined) {
  if (cost == null) {
    return supabase.from('product_variant_costs').delete().eq('variant_id', variantId)
  }
  return supabase
    .from('product_variant_costs')
    .upsert({ variant_id: variantId, cost }, { onConflict: 'variant_id' })
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function createProduct(
  input: ProductInput
): Promise<{ error: string | null }> {
  await requireAdmin()
  const { product: data, error: validationError } = validateProduct(input)
  if (!data) return { error: validationError }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const slug = data.slug!

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name: data.name.trim(),
      brand: data.brand.trim(),
      slug,
      gender: data.gender,
      description: data.description?.trim() || null,
      olfactory_notes: data.olfactory_notes,
      image_url: data.image_url || null,
      gallery_urls: data.gallery_urls ?? [],
      is_active: data.is_active,
    })
    .select('id')
    .single()

  if (productError) return { error: productError.message }

  if (data.variants.length > 0) {
    const { data: inserted, error: variantsError } = await supabase.from('product_variants').insert(
      data.variants.map((v: VariantInput) => ({
        product_id: product.id,
        size_ml: v.size_ml,
        price: v.price,
        stock: v.stock,
        sku: v.sku?.trim() || null,
      }))
    ).select('id, size_ml')
    if (variantsError) return { error: variantsError.message }

    // size_ml is unique per product, so it matches each new row to its input
    for (const row of (inserted ?? []) as { id: string; size_ml: number }[]) {
      const cost = data.variants.find((v) => v.size_ml === row.size_ml)?.cost
      if (cost != null) {
        const { error: costError } = await saveVariantCost(supabase, row.id, cost)
        if (costError) return { error: costError.message }
      }
    }
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function updateProduct(
  productId: string,
  input: ProductInput,
  deletedVariantIds: string[]
): Promise<{ error: string | null }> {
  await requireAdmin()
  if (typeof productId !== 'string' || !UUID_RE.test(productId)) return { error: 'Producto no válido.' }
  if (!Array.isArray(deletedVariantIds) || deletedVariantIds.some((id) => typeof id !== 'string' || !UUID_RE.test(id)))
    return { error: 'Datos inválidos.' }
  const { product: data, error: validationError } = validateProduct(input)
  if (!data) return { error: validationError }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const slug = data.slug!

  const { error: productError } = await supabase
    .from('products')
    .update({
      name: data.name.trim(),
      brand: data.brand.trim(),
      slug,
      gender: data.gender,
      description: data.description?.trim() || null,
      olfactory_notes: data.olfactory_notes,
      image_url: data.image_url || null,
      gallery_urls: data.gallery_urls ?? [],
      is_active: data.is_active,
    })
    .eq('id', productId)

  if (productError) return { error: productError.message }

  if (deletedVariantIds.length > 0) {
    await supabase.from('product_variants').delete().in('id', deletedVariantIds).eq('product_id', productId)
  }

  for (const v of data.variants as VariantInput[]) {
    let variantId: string | undefined
    if (v.id) {
      const { data: updated } = await supabase
        .from('product_variants')
        .update({
          size_ml: v.size_ml,
          price: v.price,
          stock: v.stock,
          sku: v.sku?.trim() || null,
        })
        .eq('id', v.id)
        .eq('product_id', productId)
        .select('id')
        .maybeSingle()
      variantId = updated?.id
    } else {
      const { data: inserted } = await supabase
        .from('product_variants')
        .insert({
          product_id: productId,
          size_ml: v.size_ml,
          price: v.price,
          stock: v.stock,
          sku: v.sku?.trim() || null,
        })
        .select('id')
        .single()
      variantId = inserted?.id
    }
    // Only for variants confirmed to belong to this product
    if (variantId) {
      const { error: costError } = await saveVariantCost(supabase, variantId, v.cost)
      if (costError) return { error: costError.message }
    }
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function deleteProduct(
  productId: string
): Promise<{ error: string | null }> {
  await requireAdmin()
  if (typeof productId !== 'string' || !UUID_RE.test(productId)) return { error: 'Producto no válido.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { error: null }
}