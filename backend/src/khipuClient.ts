import axios, { AxiosInstance } from 'axios';
import type { CreatePaymentBody, KhipuBank, KhipuPayment } from './types.js';

export class KhipuClient {
  private http: AxiosInstance;

  constructor(private apiBase: string, private apiKey: string) {
    this.http = axios.create({
      baseURL: apiBase,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  async listBanks(): Promise<KhipuBank[]> {
    const { data } = await this.http.get('/v3/banks');
    return data;
  }

  async createPayment(body: CreatePaymentBody): Promise<KhipuPayment> {
    const payload = {
      subject: body.subject,
      amount: body.amount,
      currency: body.currency ?? 'CLP',
      transaction_id: body.transaction_id,
      return_url: body.return_url,
      cancel_url: body.cancel_url,
      notify_url: body.notify_url,
      bank_id: body.bank_id,
    };
    const { data } = await this.http.post('/v3/payments', payload);
    return data;
  }

  async getPaymentById(paymentId: string): Promise<KhipuPayment> {
    const { data } = await this.http.get(`/v3/payments/${paymentId}`);
    return data;
  }
}
