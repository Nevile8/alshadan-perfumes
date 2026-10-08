'use client'

/** Opens the browser print dialog, where the receipt can be saved as PDF. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-4 py-2 rounded bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-200 transition-colors print:hidden"
    >
      Descargar PDF / Imprimir
    </button>
  )
}
