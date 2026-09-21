'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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
  const supabase = createAdminClient()
  const file = formData.get('file') as File | null

  if (!file || file.size === 0) return { url: null, error: 'No file provided' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif']
  if (!allowed.includes(ext))
    return { url: null, error: 'Formato no permitido. Usa JPG, PNG o WEBP.' }
  if (file.size > 5 * 1024 * 1024) return { url: null, error: 'El archivo supera 5MB.' }

  const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('Perfume')
    .upload(fileName, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data } = supabase.storage.from('Perfume').getPublicUrl(fileName)
  return { url: data.publicUrl, error: null }
}

export async function deleteProductImage(path: string): Promise<void> {
  const supabase = createAdminClient()
  const filePath = path.split('/storage/v1/object/public/Perfume/')[1]
  if (filePath) {
    await supabase.storage.from('Perfume').remove([filePath])
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

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
  is_active: boolean
  variants: VariantInput[]
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function createProduct(
  data: ProductInput
): Promise<{ error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const slug = data.slug?.trim() || generateSlug(data.name)

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
      is_active: data.is_active,
    })
    .select('id')
    .single()

  if (productError) return { error: productError.message }

  if (data.variants.length > 0) {
    const { error: variantsError } = await supabase.from('product_variants').insert(
      data.variants.map((v: VariantInput) => ({
        product_id: product.id,
        size_ml: v.size_ml,
        price: v.price,
        stock: v.stock,
        sku: v.sku?.trim() || null,
      }))
    )
    if (variantsError) return { error: variantsError.message }
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function updateProduct(
  productId: string,
  data: ProductInput,
  deletedVariantIds: string[]
): Promise<{ error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const slug = data.slug?.trim() || generateSlug(data.name)

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
      is_active: data.is_active,
    })
    .eq('id', productId)

  if (productError) return { error: productError.message }

  if (deletedVariantIds.length > 0) {
    await supabase.from('product_variants').delete().in('id', deletedVariantIds)
  }

  for (const v of data.variants as VariantInput[]) {
    if (v.id) {
      await supabase
        .from('product_variants')
        .update({
          size_ml: v.size_ml,
          price: v.price,
          stock: v.stock,
          sku: v.sku?.trim() || null,
        })
        .eq('id', v.id)
    } else {
      await supabase.from('product_variants').insert({
        product_id: productId,
        size_ml: v.size_ml,
        price: v.price,
        stock: v.stock,
        sku: v.sku?.trim() || null,
      })
    }
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function deleteProduct(
  productId: string
): Promise<{ error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { error: null }
}