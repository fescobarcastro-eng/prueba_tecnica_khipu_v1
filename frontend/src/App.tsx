import { Outlet, Link } from 'react-router-dom';

export default function App() {
  return (
    <div className="max-h-screen">
      <header className="bg-black text-white">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">Khipu Demo</Link>
          <nav className="text-sm space-x-4">
            <a href="https://docs.khipu.com/portal/es/payment-api/" target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100">Docs</a>
            <a href="https://docs.khipu.com/portal/es/payment-api/payment-solutions/instant-payments/description" target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100">Pagos Instantáneos</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-4xl px-4 pb-10 text-sm text-gray-500">
        <p>Modo demo · CLP ≤ 5.000 · No exponer secrets en el front.</p>
      </footer>
    </div>
  );
}
