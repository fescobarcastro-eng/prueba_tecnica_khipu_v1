export type KhipuPaymentStatus = 'pending' | 'verifying' | 'done' | 'error' | 'canceled';

export interface KhipuBank {
  bank_id: string;
  name: string;
  logo_url?: string;
  min_amount?: number;
}

export interface CreatePaymentBody {
  subject: string;
  amount: number;
  currency?: string; // por defecto 'CLP'
  transaction_id: string;
  return_url?: string;
  cancel_url?: string;
  notify_url?: string;
  bank_id?: string; // opcional: preseleccionar banco
}

export interface KhipuPayment {
  payment_id: string;
  payment_url: string;
  simplified_transfer_url?: string;
  status: KhipuPaymentStatus;
  transaction_id: string;
  amount: number;
  currency: string;
  status_detail?: string;
}
