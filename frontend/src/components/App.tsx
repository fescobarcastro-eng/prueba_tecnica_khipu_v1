import { Outlet, Link } from 'react-router-dom';

export default function App() {
  const logoHeaderUrl = (import.meta.env.VITE_KHIPU_LOGO_HEADER_URL as string | undefined) || undefined;
  const logoUrl = (import.meta.env.VITE_KHIPU_LOGO_URL as string | undefined) || undefined;
  const badgeUrl = (import.meta.env.VITE_KHIPU_BADGE_URL as string | undefined) || undefined;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-[#00B0F0] to-[#0077C8] text-white shadow">
        <div className="mx-auto max-w-7xl px-6 py-3 md:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            {/* Logo Khipu (usar variante blanca si está disponible) */}
            {(logoHeaderUrl || logoUrl) ? (
              <img
                src={logoHeaderUrl || logoUrl}
                alt="Khipu"
                className="h-10 md:h-11 w-auto object-contain shrink-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span className="font-semibold">Khipu</span>
            )}
            <span className="font-semibold">Demo de Pago</span>
          </Link>
          <nav className="text-sm flex items-center gap-4">
            {/* <Link to="/embedded" className="opacity-90 hover:opacity-100 underline underline-offset-4">Pago embebido</Link> */}
            <a href="https://docs.khipu.com/portal/es/payment-api/" target="_blank" rel="noreferrer" className="opacity-90 hover:opacity-100">Docs</a>
            <a href="https://docs.khipu.com/portal/es/payment-api/payment-solutions/instant-payments/description" target="_blank" rel="noreferrer" className="opacity-90 hover:opacity-100">Pagos Instantáneos</a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Outlet />
        </div>
      </main>
      <footer className="border-t bg-white/70">
        <div className="mx-auto max-w-7xl px-6 py-6 text-sm text-slate-600 flex items-center justify-between">
          <p>Modo demo · CLP ≤ $5.000 · No expongas secretos en el front.</p>
          <div className="flex items-center gap-2 opacity-80">
            {badgeUrl ? (
              <img
                src={badgeUrl}
                alt="Pagos por Khipu"
                className="h-8 w-auto object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
