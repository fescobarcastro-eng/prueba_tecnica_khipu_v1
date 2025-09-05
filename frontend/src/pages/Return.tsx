import { useEffect, useMemo, useRef, useState } from 'react';
import { getPayment, type KhipuStatus, type Payment } from '../lib/api';

function useQuery() {
  return useMemo(() => new URLSearchParams(window.location.search), []);
}

function timeAgo(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

function StatusPill({ status }: { status: KhipuStatus | string }) {
  const map: Record<string, { cls: string; label: string }> = {
    done: { cls: 'bg-emerald-100 text-emerald-800', label: 'pagado' },
    verifying: { cls: 'bg-amber-100 text-amber-800', label: 'verificando' },
    pending: { cls: 'bg-amber-100 text-amber-800', label: 'pendiente' },
    canceled: { cls: 'bg-red-100 text-red-800', label: 'cancelado' },
    error: { cls: 'bg-red-100 text-red-800', label: 'error' },
  };
  const it = map[String(status)] || { cls: 'bg-gray-100 text-gray-800', label: String(status) };
  return <span className={`inline-block rounded-full px-2 py-0.5 ${it.cls}`}>{it.label}</span>;
}

export default function Return() {
  const q = useQuery();
  const urlPid = q.get('payment_id') || q.get('paymentId');
  const [paymentId] = useState<string | null>(urlPid || localStorage.getItem('lastPaymentId'));
  const [orderId] = useState<string | null>(localStorage.getItem('lastOrderId'));
  const [status, setStatus] = useState<KhipuStatus | string>('verificando');
  const [json, setJson] = useState<string>('Esperando…');
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [copyMsg, setCopyMsg] = useState<string>('');
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const stepIndex = status === 'done' ? 3 : status === 'verifying' || status === 'pending' ? 2 : 1;

  useEffect(() => {
    async function tick() {
      if (!paymentId) {
        setStatus('sin payment_id');
        setJson('No se detectó payment_id en URL ni en localStorage.');
        return;
      }
      try {
        const data: Payment = await getPayment(paymentId);
        setJson(JSON.stringify(data, null, 2));
        const st: string = data.status || 'desconocido';
        setStatus(st);
        setLastUpdate(Date.now());
        setAmount(typeof data.amount === 'number' ? data.amount : null);
        setCurrency(data.currency || null);
        setReceiptUrl(data.simplified_transfer_url || null);
        if (st !== 'done' && st !== 'canceled' && st !== 'error') {
          timerRef.current = window.setTimeout(tick, 2000);
        }
      } catch (e: unknown) {
        setStatus('error consultando');
        setJson(String(e));
        timerRef.current = window.setTimeout(tick, 3000);
      }
    }
    tick();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [paymentId]);

  function copy(text?: string | null) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyMsg('Copiado');
      setTimeout(() => setCopyMsg(''), 1200);
    });
  }

  function formatAmount(v: number | null, cur: string | null) {
    if (v == null) return null;
    try {
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency: cur || 'CLP', maximumFractionDigits: 0 }).format(v);
    } catch {
      return `${v} ${cur || ''}`.trim();
    }
  }

  return (
    <div className="rounded-3xl border bg-white p-6 md:p-8 shadow-sm">
      {/* Encabezado según estado */}
      {status === 'done' ? (
        <div className="mb-4 flex items-start gap-3">
          <div className="grid place-items-center rounded-full bg-emerald-100 text-emerald-700 h-8 w-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M8.603 10.803a.75.75 0 011.06 0l1.97 1.97 4.704-4.703a.75.75 0 111.06 1.06l-5.235 5.235a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 010-1.06z" clipRule="evenodd"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-emerald-700">Pago recibido</h1>
            <p className="text-sm text-slate-600">Tu pago fue acreditado correctamente.</p>
          </div>
        </div>
      ) : status === 'canceled' || status === 'error' ? (
        <div className="mb-4 flex items-start gap-3">
          <div className="grid place-items-center rounded-full bg-red-100 text-red-700 h-8 w-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zM9.53 9.53a.75.75 0 011.06 0L12 10.94l1.41-1.41a.75.75 0 111.06 1.06L13.06 12l1.41 1.41a.75.75 0 11-1.06 1.06L12 13.06l-1.41 1.41a.75.75 0 11-1.06-1.06L10.94 12 9.53 10.59a.75.75 0 010-1.06z" clipRule="evenodd"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-red-700">No pudimos completar tu pago</h1>
            <p className="text-sm text-slate-600">Puedes volver a intentarlo desde la tienda.</p>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-start gap-3">
          <div className="grid place-items-center rounded-full bg-sky-100 text-sky-700 h-8 w-8">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold">¡Gracias! Validando tu pago…</h1>
            <p className="text-sm text-slate-600">El backend confirmará vía webhook y esta página consulta periódicamente el estado.</p>
          </div>
        </div>
      )}

      {/* Resumen y acciones */}
      <div className="grid gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500">Orden:</span>
          <span className="font-mono">{orderId || '(desconocida)'}</span>
          <button onClick={() => copy(orderId)} className="rounded border px-2 py-0.5 text-xs hover:bg-slate-50">Copiar</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500">Payment ID:</span>
          <span className="font-mono">{paymentId || '(desconocido)'}</span>
          <button onClick={() => copy(paymentId)} className="rounded border px-2 py-0.5 text-xs hover:bg-slate-50">Copiar</button>
          {copyMsg && <span className="text-emerald-600">{copyMsg}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Estado:</span>
          <StatusPill status={status} />
          <span className="text-slate-400 text-xs">Última actualización: {timeAgo(Date.now() - lastUpdate)}</span>
        </div>
        {amount != null && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Monto:</span>
            <span className="font-medium">{formatAmount(amount, currency)}</span>
          </div>
        )}
        {receiptUrl && status === 'done' && (
          <div className="flex items-center gap-2">
            <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">Ver comprobante</a>
          </div>
        )}
      </div>

      {/* Progreso */}
      <ol className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <li className={`rounded-lg border p-2 ${stepIndex >= 1 ? 'border-sky-300 bg-sky-50 text-sky-800' : 'text-slate-500'}`}>
          1. Pago creado
        </li>
        <li className={`rounded-lg border p-2 ${stepIndex >= 2 ? 'border-amber-300 bg-amber-50 text-amber-800' : 'text-slate-500'}`}>
          2. Verificación bancaria
        </li>
        <li className={`rounded-lg border p-2 ${stepIndex >= 3 ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'text-slate-500'}`}>
          3. Acreditado
        </li>
      </ol>

      {/* Acciones */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a href="/" className="inline-flex items-center justify-center rounded-xl bg-[#00B0F0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00A0DA]">Continuar</a>
        <button onClick={() => setShowDetails((v) => !v)} className="text-sm text-slate-700 underline">
          {showDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}
        </button>
        <button onClick={() => setLastUpdate(Date.now())} className="text-sm text-slate-500 hover:text-slate-700">Reintentar ahora</button>
      </div>

      {showDetails && (
        <pre className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-800 overflow-auto max-h-96">{json}</pre>
      )}
    </div>
  );
}
