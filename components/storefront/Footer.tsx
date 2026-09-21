import Image from 'next/image'
import Link from 'next/link'
import { submitContactForm } from '@/app/(storefront)/actions'

const CATEGORIES = [
  { label: 'Hombre', href: '/?gender=hombre' },
  { label: 'Mujer',  href: '/?gender=mujer' },
  { label: 'Unisex', href: '/?gender=unisex' },
]

const NAV_LINKS = [
  { label: 'Inicio',                  href: '/' },
  { label: 'Mi Cuenta',               href: '/account' },
  { label: 'Carrito',                 href: '/cart' },
  { label: 'Terminos y Condiciones',  href: '/terms' },
]

async function ContactForm() {
  async function handleSubmit(formData: FormData) {
    'use server'
    await submitContactForm(formData)
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <input
        name="name"
        type="text"
        placeholder="Nombre"
        required
        className="w-full px-4 py-2.5 text-sm bg-white border border-[#E8DEC8] rounded-lg
                   text-[#2C221E] placeholder-[#7A6E65] focus:outline-none focus:border-[#D4A054] transition-colors"
      />
      <input
        name="email"
        type="email"
        placeholder="Correo electronico"
        required
        className="w-full px-4 py-2.5 text-sm bg-white border border-[#E8DEC8] rounded-lg
                   text-[#2C221E] placeholder-[#7A6E65] focus:outline-none focus:border-[#D4A054] transition-colors"
      />
      <textarea
        name="message"
        placeholder="Mensaje"
        rows={3}
        required
        className="w-full px-4 py-2.5 text-sm bg-white border border-[#E8DEC8] rounded-lg
                   text-[#2C221E] placeholder-[#7A6E65] focus:outline-none focus:border-[#D4A054] transition-colors resize-none"
      />
      <button
        type="submit"
        className="w-full py-2.5 bg-[#E86A33] text-white text-xs font-medium tracking-widest
                   uppercase rounded-lg hover:bg-[#d05a28] transition-colors"
      >
        Enviar Mensaje
      </button>
    </form>
  )
}

export function Footer() {
  return (
    <footer className="bg-[#FDF9F3] border-t border-[#E8DEC8] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1: Brand */}
          <div className="space-y-4">
            <Image
              src="/Logo.png"
              alt="ALSHADAN"
              width={120}
              height={36}
              className="h-8 w-auto object-contain"
            />
            <p className="text-sm text-[#7A6E65] leading-relaxed">
              Fragancias de lujo cuidadosamente seleccionadas para quienes aprecian la elegancia y la distincion.
            </p>
            <p className="text-xs text-[#7A6E65]">© {new Date().getFullYear()} ALSHADAN. Todos los derechos reservados.</p>
          </div>

          {/* Col 2: Categories + Navigation */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-[#2C221E] mb-3">
                Categorias
              </h4>
              <ul className="space-y-2">
                {CATEGORIES.map((c) => (
                  <li key={c.href}>
                    <Link href={c.href} className="text-sm text-[#7A6E65] hover:text-[#D4A054] transition-colors">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-[#2C221E] mb-3">
                Navegacion
              </h4>
              <ul className="space-y-2">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-[#7A6E65] hover:text-[#D4A054] transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Col 3: Contact info */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest uppercase text-[#2C221E]">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm text-[#7A6E65]">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">✉</span>
                <a href="mailto:contacto@alshadan.com" className="hover:text-[#D4A054] transition-colors">
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
            <h4 className="text-xs font-semibold tracking-widest uppercase text-[#2C221E]">
              Escribenos
            </h4>
            <ContactForm />
          </div>
        </div>
      </div>
    </footer>
  )
}