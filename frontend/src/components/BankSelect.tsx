import { useEffect, useMemo, useState } from 'react';
import { listBanks, type Bank } from '../lib/api';

interface Props {
  onChange?: (bank: Bank | null) => void;
  label?: string;
}

function formatCLP(v: number) {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
  } catch {
    return `$${Math.round(v)}`;
  }
}

export default function BankSelect({ onChange, label = 'Selecciona tu banco' }: Props) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    listBanks()
      .then((arr) => setBanks(arr))
      .catch(() => setError('No fue posible cargar bancos'))
      .finally(() => setLoading(false));
  }, []);

  const selectedBank = useMemo(() => banks.find((b) => b.bank_id === selectedId) ?? null, [banks, selectedId]);

  useEffect(() => {
    onChange?.(selectedBank);
  }, [selectedBank, onChange]);

  if (loading) return <p className="text-sm text-gray-500">Cargando bancos…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!banks.length) return <p className="text-sm text-gray-500">No hay bancos disponibles.</p>;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
      >
        <option value="">Elige un banco…</option>
        {banks.map((b) => (
          <option key={b.bank_id} value={b.bank_id}>
            {b.name}
            {b.min_amount != null ? ` (mín: ${formatCLP(b.min_amount)})` : ''}
          </option>
        ))}
      </select>

      {selectedBank && (
        <div className="text-xs text-gray-600">
          {selectedBank.message ? <p className="mt-1">{selectedBank.message}</p> : null}
        </div>
      )}
    </div>
  );
}
