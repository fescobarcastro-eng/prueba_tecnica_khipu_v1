import { useMemo, useState } from 'react';
import { createPayment } from '../lib/api';
import BankList from '../components/BankList';
import BankSelect from '../components/BankSelect';
import type { Bank } from '../lib/api';

function newOrderId() {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 7);
  return `orden-${ts}-${rnd}`;
}

function formatCLP(v: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
}

export default function Checkout() {
  const [amount, setAmount] = useState<number>(4990);
  const [orderId] = useState<string>(useMemo(newOrderId, []));
  const [subject, setSubject] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err' | 'warn' | 'info'; text: string } | null>(null);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBanks, setShowBanks] = useState(false);

  const origin = window.location.origin;
  const badgeUrl = (import.meta.env.VITE_KHIPU_BADGE_URL as string | undefined) || undefined;
  const trustBadgeUrl = (import.meta.env.VITE_KHIPU_TRUST_BADGE_URL as string | undefined) || badgeUrl;

  async function onPay() {
    if (!amount || amount < 1 || amount > 5000) {
      setMsg({ type: 'warn', text: 'El monto debe ser entre 1 y 5000 CLP (modo demo).' });
      return;
    }
    setLoading(true);
    setMsg({ type: 'info', text: 'Creando pago…' });
    try {
      const res = await createPayment({
        amount,
        transaction_id: orderId,
        subject: subject || `Orden ${orderId}`,
        return_url: `${origin}/return`,
        cancel_url: `${origin}/cancel`,
        bank_id: selectedBank?.bank_id
      });
      localStorage.setItem('lastPaymentId', res.paymentId);
      localStorage.setItem('lastOrderId', orderId);
      setMsg({ type: 'ok', text: 'Redirigiendo a Khipu…' });
      window.location.href = res.paymentUrl;
    } catch (e: unknown) {
      console.error(e);
      setMsg({ type: 'err', text: 'Error al crear el pago. Revisa la consola y el backend.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {/* Columna principal de pago */}
      <div className="md:col-span-2 rounded-3xl border bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-sm font-medium text-slate-700">Total a pagar</h1>
            <p className="mt-0.5 text-4xl font-bold tracking-tight">{formatCLP(amount)}</p>
            <p className="mt-1 text-xs text-slate-500">Transferencia bancaria segura operada por Khipu</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700 ring-1 ring-sky-200">Khipu&nbsp;<span className="font-semibold">Pay</span></span>
        </div>

        {/* CTA principal */}
        <button
          onClick={onPay}
          disabled={loading}
          className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#00B0F0] px-6 py-4 text-base font-semibold text-white shadow-sm ring-1 ring-sky-400/30 transition hover:bg-[#00A0DA] focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:opacity-60"
          aria-label="Pagar ahora con Khipu"
        >
          {/* Candado */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90">
            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6A3.75 3.75 0 007.5 22.5h9a3.75 3.75 0 003.75-3.75v-6a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
          </svg>
          {loading ? 'Procesando…' : 'Pagar ahora con Khipu'}
          {/* Flecha */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 transition -mr-1 group-hover:translate-x-0.5">
            <path fillRule="evenodd" d="M4.5 12a.75.75 0 01.75-.75h11.69l-3.72-3.72a.75.75 0 111.06-1.06l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06l3.72-3.72H5.25A.75.75 0 014.5 12z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Alternativa embebida */}
        {/* <a href="/embedded" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-sky-800 hover:bg-sky-50">
          Abrir pago en ventana emergente
        </a> */}

        {/* Confianzas */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 1.5l8.25 4.125v6.75c0 5.109-3.533 9.847-8.25 10.875C7.533 22.222 4 17.484 4 12.375V5.625L12 1.5z"/></svg>
            Transacción segura
          </div>
          <span>•</span>
          <div>No compartimos tus credenciales bancarias</div>
          {trustBadgeUrl ? (
            <>
              <span>•</span>
              <div className="flex items-center gap-2">
                <img
                  src={trustBadgeUrl}
                  alt="Seguro por Khipu"
                  className="h-6 md:h-7 w-auto object-contain"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Detalles opcionales */}
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full text-left text-sm font-medium text-slate-800"
          >
            {showAdvanced ? 'Ocultar detalles' : 'Editar detalles del pago'}
          </button>
          {showAdvanced && (
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Monto (CLP)</label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Asunto</label>
                <input
                  type="text"
                  placeholder="Orden demo"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
                <p className="mt-1 text-xs text-slate-500">Se mostrará como descripción del pago.</p>
              </div>
              {/* Banco (opcional) */}
              <div className="md:col-span-2">
                <BankSelect onChange={setSelectedBank} label="Selecciona tu banco (opcional)" />
                {selectedBank?.min_amount != null ? (
                  <p className="text-xs text-slate-500 mt-1">Monto mínimo del banco seleccionado: {formatCLP(selectedBank.min_amount)}</p>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {msg && (
          <p
            className={`mt-4 text-sm ${
              msg.type === 'ok'
                ? 'text-emerald-700'
                : msg.type === 'err'
                ? 'text-red-600'
                : msg.type === 'warn'
                ? 'text-amber-700'
                : 'text-slate-600'
            }`}
          >
            {msg.text}
          </p>
        )}

        <p className="mt-8 text-xs text-slate-500">
          Modo demo: límite CLP $5.000. El estado final se confirma en el backend vía webhook.
        </p>
      </div>

      {/* Columna lateral informativa: Bancos compatibles */}
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Bancos compatibles</h2>
          <button
            type="button"
            onClick={() => setShowBanks((v) => !v)}
            className="text-xs text-slate-600 hover:text-slate-800"
          >
            {showBanks ? 'Ocultar' : 'Ver lista'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">Operado por Khipu</p>
        {showBanks ? <BankList /> : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-slate-600">Selecciona tu banco dentro del flujo de Khipu o expande para ver el listado.</div>
        )}
      </div>
    </div>
  );
}
