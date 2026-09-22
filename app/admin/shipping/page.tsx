import { createAdminClient } from '@/lib/supabase/admin'
import { SurchargeForm } from '@/components/admin/SurchargeForm'
import { CommuneTable } from '@/components/admin/CommuneTable'
import type { Commune, StoreSetting } from '@/lib/types/database'

export default async function AdminShippingPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const [{ data: communesRaw }, { data: settingsRaw }] = await Promise.all([
    supabase.from('communes').select('*').order('region_code').order('commune_name'),
    supabase.from('store_settings').select('*'),
  ])

  const communes  = (communesRaw  ?? []) as Commune[]
  const settings  = (settingsRaw  ?? []) as StoreSetting[]
  const surcharge = Number((settings.find((s) => s.key === 'extra_item_surcharge_percent')?.value ?? 15))

  // Group communes by region
  const byRegion = communes.reduce<Record<string, Commune[]>>((acc, c) => {
    const key = `${c.region_code}__${c.region_name}`
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light text-white tracking-wide">Gestionar Envios</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Configura los precios por comuna y el porcentaje adicional por perfume extra.
        </p>
      </div>

      {/* Surcharge setting */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-8">
        <h3 className="text-sm text-neutral-300 tracking-wider uppercase mb-1">
          Recargo por Perfume Adicional
        </h3>
        <p className="text-neutral-500 text-xs mb-5">
          Se aplica al precio base de la comuna multiplicado por la cantidad de perfumes extra (total - 1).
        </p>
        <SurchargeForm currentValue={surcharge} />
      </div>

      {/* Communes by region */}
      <div className="space-y-6">
        {Object.entries(byRegion).map(([key, regionCommunes]) => {
          const [, regionName] = key.split('__')
          return (
            <div key={key} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-800/40">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-widest">
                  {regionName}
                </h4>
              </div>
              <CommuneTable communes={regionCommunes} />
            </div>
          )
        })}
      </div>
    </div>
  )
}