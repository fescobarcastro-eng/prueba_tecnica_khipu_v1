export type KhipuStatus = 'pending' | 'verifying' | 'done' | 'error' | 'canceled';

export interface Bank {
  bank_id: string;
  name: string;
  logo_url?: string;
  min_amount?: number;
  message?: string;
  type?: string;
}

export interface CreatePaymentReq {
  amount: number;
  transaction_id: string;
  subject?: string;
  return_url?: string;
  cancel_url?: string;
  bank_id?: string;
}

export interface CreatePaymentRes {
  paymentId: string;
  paymentUrl: string;
  status: KhipuStatus;
}

export interface Payment {
  payment_id: string;
  payment_url: string;
  status: KhipuStatus;
  transaction_id: string;
  amount: number;
  currency: string;
  status_detail?: string;
  simplified_transfer_url?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export async function listBanks(): Promise<Bank[]> {
  const res = await fetch(`${API_BASE}/api/banks`);
  if (!res.ok) throw new Error('banks_failed');
  const data: unknown = await res.json();
  const arr = Array.isArray(data) ? data : (data as { banks?: unknown })?.banks;
  if (!Array.isArray(arr)) return [];
  return arr.map((item): Bank => {
    const b = item as Record<string, unknown>;
    const min = b.min_amount;
    return {
      bank_id: (b.bank_id as string) ?? (b.id as string),
      name: (b.name as string) ?? '',
      logo_url: (b.logo_url as string) ?? undefined,
      min_amount: min != null ? Number.parseFloat(String(min)) : undefined,
      message: (b.message as string) ?? undefined,
      type: (b.type as string) ?? undefined,
    };
  });
}

export async function createPayment(body: CreatePaymentReq): Promise<CreatePaymentRes> {
  const res = await fetch(`${API_BASE}/api/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPayment(id: string): Promise<Payment> {
  const res = await fetch(`${API_BASE}/api/payments/${id}`);
  if (!res.ok) throw new Error('payment_not_found');
  return res.json();
}
