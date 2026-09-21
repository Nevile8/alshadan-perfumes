import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TEST_PRODUCTS = [
  {
    name: 'Royal Oud',
    brand: 'Alshadan',
    slug: 'royal-oud',
    gender: 'hombre',
    description: 'Una fragancia audaz y majestuosa con corazon de oud arabe, envuelta en saffron y ambar calido.',
    olfactory_notes: ['Oud', 'Azafran', 'Ambar', 'Sandalo', 'Cuero'],
    image_url: null,
    is_active: true,
    variants: [
      { size_ml: 50, price: 49900, stock: 25, sku: 'RO-50' },
      { size_ml: 100, price: 89900, stock: 15, sku: 'RO-100' },
    ],
  },
  {
    name: 'Rose Elixir',
    brand: 'Alshadan',
    slug: 'rose-elixir',
    gender: 'mujer',
    description: 'Romantica y femenina, una explosion de petalos de rosa turca con corazon de jazmin y fondo de almizle.',
    olfactory_notes: ['Rosa', 'Jazmin', 'Almizle', 'Bergamota', 'Pachuli'],
    image_url: null,
    is_active: true,
    variants: [
      { size_ml: 30, price: 34900, stock: 30, sku: 'RE-30' },
      { size_ml: 50, price: 54900, stock: 20, sku: 'RE-50' },
      { size_ml: 100, price: 94900, stock: 10, sku: 'RE-100' },
    ],
  },
  {
    name: 'Midnight Amber',
    brand: 'Alshadan',
    slug: 'midnight-amber',
    gender: 'unisex',
    description: 'Oscuro y seductor. Ambar dorado que se funde con vainilla y sandalo blanco.',
    olfactory_notes: ['Ambar', 'Vainilla', 'Sandalo', 'Benjui', 'Incienso'],
    image_url: null,
    is_active: true,
    variants: [
      { size_ml: 50, price: 59900, stock: 18, sku: 'MA-50' },
      { size_ml: 100, price: 99900, stock: 12, sku: 'MA-100' },
    ],
  },
  {
    name: 'Desert Wind',
    brand: 'Alshadan',
    slug: 'desert-wind',
    gender: 'hombre',
    description: 'Fresco y vigoroso como el viento del desierto al amanecer.',
    olfactory_notes: ['Bergamota', 'Cedro', 'Vetiver', 'Pimienta Negra', 'Musgo'],
    image_url: null,
    is_active: true,
    variants: [
      { size_ml: 100, price: 79900, stock: 22, sku: 'DW-100' },
    ],
  },
  {
    name: 'Jasmine Dreams',
    brand: 'Alshadan',
    slug: 'jasmine-dreams',
    gender: 'mujer',
    description: 'Delicada y soadora. Jazmin blanco con toques de ylang-ylang y corazon frutal de melocoton.',
    olfactory_notes: ['Jazmin', 'Ylang-Ylang', 'Melocoton', 'Rosa', 'Almizle Blanco'],
    image_url: null,
    is_active: true,
    variants: [
      { size_ml: 50, price: 52900, stock: 28, sku: 'JD-50' },
      { size_ml: 100, price: 92900, stock: 14, sku: 'JD-100' },
    ],
  },
  {
    name: 'Golden Sands',
    brand: 'Alshadan',
    slug: 'golden-sands',
    gender: 'unisex',
    description: 'Una mezcla mistica de incienso sagrado y mirra con base de ambar dorado.',
    olfactory_notes: ['Incienso', 'Mirra', 'Ambar Dorado', 'Oud', 'Especias'],
    image_url: null,
    is_active: true,
    variants: [
      { size_ml: 30, price: 39900, stock: 35, sku: 'GS-30' },
      { size_ml: 100, price: 89900, stock: 16, sku: 'GS-100' },
    ],
  },
]

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  if ((count ?? 0) > 0) {
    return NextResponse.json({
      message: `Seed skipped — database already has ${count} products.`,
      seeded: 0,
    })
  }

  const results = []

  for (const p of TEST_PRODUCTS) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name: p.name,
        brand: p.brand,
        slug: p.slug,
        gender: p.gender,
        description: p.description,
        olfactory_notes: p.olfactory_notes,
        image_url: p.image_url,
        is_active: p.is_active,
      })
      .select('id, name')
      .single()

    if (productError) {
      results.push({ name: p.name, error: productError.message })
      continue
    }

    const { error: variantsError } = await supabase.from('product_variants').insert(
      p.variants.map((v) => ({ ...v, product_id: product.id }))
    )

    results.push({
      name: product.name,
      id: product.id,
      variants: p.variants.length,
      error: variantsError?.message ?? null,
    })
  }

  return NextResponse.json({
    message: `Seeded ${results.filter((r: {error: unknown}) => !r.error).length} products successfully.`,
    results,
  })
}