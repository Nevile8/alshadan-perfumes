export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="w-full max-w-md px-6 py-8">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.3em] text-neutral-500 uppercase mb-1">
            Luxury Perfumes
          </p>
          <h1 className="text-2xl font-light tracking-widest text-white uppercase">
            Alshadan
          </h1>
        </div>
        {children}
      </div>
    </div>
  )
}
