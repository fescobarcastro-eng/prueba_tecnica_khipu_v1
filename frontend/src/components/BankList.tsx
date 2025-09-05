import { useEffect, useState } from 'react';
import { listBanks, type Bank } from '../lib/api';

function formatCLP(v: number) {
  try { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v); } catch { return `$${Math.round(v)}`; }
}

export default function BankList() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listBanks()
      .then(setBanks)
      .catch(() => setError('No fue posible cargar bancos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Cargando bancos…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!banks.length) return <p className="text-sm text-gray-500">No hay bancos disponibles.</p>;

  return (
    <ul className="divide-y divide-gray-100">
      {banks.map((b) => (
        <li key={b.bank_id} className="flex items-start gap-3 py-3">
          {b.logo_url ? (
            <img className="h-6 w-6 mt-0.5 object-contain" src={b.logo_url} alt="logo banco" />
          ) : (
            <div className="h-6 w-6 mt-0.5 rounded bg-gray-200" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className="font-medium">{b.name}</span>
              {b.type ? <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">{b.type}</span> : null}
              {b.min_amount != null ? (
                <span className="text-gray-500 text-xs">(mín: {formatCLP(b.min_amount)})</span>
              ) : null}
            </div>
            {b.message ? <p className="mt-0.5 text-xs text-gray-500">{b.message}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
