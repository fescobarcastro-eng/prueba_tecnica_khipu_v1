import { useEffect, useRef, useState, useCallback } from 'react';
import { getPayment, type Payment } from '../lib/api';

declare global {
  interface Window {
    Khipu?: unknown;
    khipu?: unknown;
    KHIPU?: unknown;
  }
}

interface KhipuApiLike {
  startOperation: (id: string, cb: (r: unknown) => void, opts: unknown) => void;
  close?: () => void;
}

interface Props {
  paymentId?: string;
}

function isKhipuConstructor(x: unknown): x is new () => KhipuApiLike {
  return typeof x === 'function';
}

function isKhipuObject(x: unknown): x is KhipuApiLike {
  if (typeof x !== 'object' || x === null) return false;
  const rec = x as Record<string, unknown>;
  return typeof rec.startOperation === 'function';
}

function hasKhipuGlobal() {
  const g = window as unknown as Record<string, unknown>;
  const candidates: unknown[] = [window.Khipu, g['Khipu'], g['khipu'], g['KHIPU']];
  return candidates.some((c) => isKhipuConstructor(c) || isKhipuObject(c));
}

function resolveKhipuInstance(): KhipuApiLike {
  const g = window as unknown as Record<string, unknown>;
  const K: unknown = window.Khipu ?? g['Khipu'] ?? g['khipu'] ?? g['KHIPU'];
  if (!K) throw new Error('Khipu SDK no detectado');
  if (isKhipuConstructor(K)) return new K();
  if (isKhipuObject(K)) return K;
  throw new Error('Khipu SDK encontrado pero con forma desconocida');
}

function loadKhipuSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (hasKhipuGlobal()) return resolve();
    // Detectar cualquier script existente del SDK
    const existing = (document.querySelector('script[src*="js.khipu.com/v1/kws.js"]') || document.querySelector('script[src*="//js.khipu.com/v1/kws.js"]')) as HTMLScriptElement | null;
    if (existing) {
      // Si ya existe, resolvemos y dejemos que el bucle de espera verifique el global
      return resolve();
    }
    const s = document.createElement('script');
    s.src = 'https://js.khipu.com/v1/kws.js';
    s.async = true;
    s.defer = true;
    s.setAttribute('data-khipu-sdk', 'true');
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('No se pudo cargar el SDK (inserción)'));
    document.head.appendChild(s);
  });
}

export default function PayEmbedded({ paymentId = '' }: Props) {
  const [ready, setReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [pid] = useState<string>(() => {
    const q = new URLSearchParams(window.location.search);
    return (
      paymentId ||
      q.get('payment_id') ||
      q.get('paymentId') ||
      localStorage.getItem('lastPaymentId') ||
      ''
    );
  });
  // Forzar siempre modal
  const useModal = true;
  const khipuRef = useRef<{ close?: () => void } | null>(null);

  useEffect(() => {
    let canceled = false;
    async function ensure() {
      try {
        // Intenta detección rápida
        if (hasKhipuGlobal()) {
          if (!canceled) setReady(true);
          return;
        }
        // Carga dinámica como fallback
        await loadKhipuSdk();
        // Espera activa hasta 10s por el global
        const start = Date.now();
        while (!hasKhipuGlobal() && Date.now() - start < 10000) {
          await new Promise((r) => setTimeout(r, 100));
        }
        if (!hasKhipuGlobal()) throw new Error('SDK cargado pero no expone el global');
        if (!canceled) setReady(true);
      } catch (e: unknown) {
        if (!canceled) setSdkError((e as Error)?.message || String(e));
      }
    }
    ensure();
    return () => { canceled = true; };
  }, []);

  useEffect(() => {
    // Intenta pre-cargar el payment_url para fallback
    async function fetchPaymentUrl() {
      try {
        if (!pid) return;
        const p: Payment = await getPayment(pid);
        if (p?.payment_url) setFallbackUrl(p.payment_url);
      } catch {
        // ignora
      }
    }
    fetchPaymentUrl();
  }, [pid]);

  const startKhipu = useCallback(() => {
    try {
      setSdkError(null);
      const callback = (result: unknown) => {
        console.log('khipu callback:', result);
      };
      const options = {
        // Eliminado mountElement: siempre modal
        modal: useModal,
        modalOptions: { maxWidth: 480, maxHeight: 860 },
        options: {
          style: {
            primaryColor: '#00B0F0',
            fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
          },
          skipExitPage: false,
        },
      } as const;

      const instance = resolveKhipuInstance();
      khipuRef.current = instance;
      instance.startOperation(pid, callback, options);
    } catch (e) {
      setSdkError((e as Error)?.message || String(e));
    }
  }, [useModal, pid]);

  useEffect(() => {
    if (!ready || !pid) return;
    startKhipu();
    return () => {
      try { khipuRef.current?.close?.(); } catch { /* noop */ }
    };
  }, [ready, pid, startKhipu]);

  function retryModal() {
    setReady(false);
    setSdkError(null);
    (async () => {
      try {
        await loadKhipuSdk();
        setReady(true);
        // no auto-start aquí; deja al usuario apretar el botón si hubo error
      } catch (e) {
        setSdkError((e as Error)?.message || String(e));
      }
    })();
  }

  // Pequeño diagnóstico para depurar formas del global
  const debugInfo = (() => {
    try {
      const g = window as unknown as Record<string, unknown>;
      const names = ['Khipu', 'khipu', 'KHIPU'] as const;
      return names
        .map((n) => {
          const v = g[n];
          const t = typeof v;
          let keys = '';
          if (t === 'object' && v !== null) {
            keys = ' keys=' + Object.keys(v as Record<string, unknown>).join(',');
          }
          return `${n}: ${t}${keys}`;
        })
        .join(' | ');
    } catch {
      return '';
    }
  })();

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold mb-2">Pagar con Khipu (modal)</h2>
      {!pid && (
        <div className="text-sm text-slate-700">
          <p>No hay un payment_id disponible.</p>
          <ul className="list-disc ml-5 mt-2 text-slate-600">
            <li>Primero crea un pago desde el checkout (botón “Pagar ahora con Khipu”).</li>
            <li>O abre esta página con <code>?payment_id=...</code> en la URL.</li>
          </ul>
          <a href="/" className="inline-flex mt-3 rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Ir al checkout</a>
        </div>
      )}
      {/* Eliminado contenedor embebido */}
      {!ready && !sdkError && <p className="text-sm text-gray-500 mt-2">Cargando componente de pago…</p>}
      {sdkError && (
        <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {sdkError}
          <div className="mt-1 text-xs opacity-80">{debugInfo}</div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <button onClick={startKhipu} disabled={!ready || !pid} className="rounded border px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50">Abrir pago ahora</button>
        <button onClick={retryModal} className="rounded border px-3 py-1.5 hover:bg-slate-50">Reintentar carga del SDK</button>
        {/* Eliminado: Abrir embebido (sin modal) */}
        {fallbackUrl && <a href={fallbackUrl} target="_blank" rel="noreferrer" className="rounded border px-3 py-1.5 hover:bg-slate-50">Abrir en pestaña nueva</a>}
      </div>
    </div>
  );
}
