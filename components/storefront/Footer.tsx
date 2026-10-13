import Image from 'next/image'
import Link from 'next/link'
import { ContactForm } from './ContactForm'

const CATEGORIES = [
  { label: 'Hombre', href: '/?gender=hombre' },
  { label: 'Mujer',  href: '/?gender=mujer' },
  { label: 'Unisex', href: '/?gender=unisex' },
]

const NAV_LINKS = [
  { label: 'Inicio',                  href: '/' },
  { label: 'Mi Cuenta',               href: '/account' },
  { label: 'Carrito',                 href: '/cart' },
  { label: 'Rastrear Pedido',         href: '/track' },
  { label: 'Terminos y Condiciones',  href: '/terms' },
]

export function Footer() {
  return (
    <footer className="bg-onyx-card/95 border-t border-gold/40 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1: Brand */}
          <div className="space-y-4">
            <Image
              src="/logo-gold.svg"
              alt="ALSHADAN"
              width={67}
              height={52}
              className="h-14 w-auto object-contain"
              unoptimized
            />
            <p className="text-sm text-smoke leading-relaxed">
              Fragancias de lujo cuidadosamente seleccionadas para quienes aprecian la elegancia y la distincion.
            </p>
            <p className="text-xs text-smoke">© {new Date().getFullYear()} ALSHADAN. Todos los derechos reservados.</p>
          </div>

          {/* Col 2: Categories + Navigation */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-ivory mb-3">
                Categorias
              </h4>
              <ul className="space-y-2">
                {CATEGORIES.map((c) => (
                  <li key={c.href}>
                    <Link href={c.href} className="text-sm text-smoke hover:text-gold transition-colors">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-ivory mb-3">
                Navegacion
              </h4>
              <ul className="space-y-2">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-smoke hover:text-gold transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Col 3: Contact info */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest uppercase text-ivory">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm text-smoke">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">✉</span>
                <a href="mailto:contacto@alshadan.com" className="hover:text-gold transition-colors">
                  contacto@alshadan.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">☎</span>
                <span>+56 9 XXXX XXXX</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">📍</span>
                <span>Santiago, Chile</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact form */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest uppercase text-ivory">
              Escribenos
            </h4>
            <ContactForm />
          </div>
        </div>
      </div>
    </footer>
  )
}