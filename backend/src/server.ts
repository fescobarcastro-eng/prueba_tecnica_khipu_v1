import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { KhipuClient } from './khipuClient.js';
import type { CreatePaymentBody, KhipuPayment } from './types.js';

const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? `http://localhost:${PORT}`;
const KHIPU_API_BASE = process.env.KHIPU_API_BASE ?? 'https://payment-api.khipu.com';
const KHIPU_API_KEY = process.env.KHIPU_API_KEY;

if (!KHIPU_API_KEY) {
  console.error('Falta KHIPU_API_KEY en el .env');
  process.exit(1);
}

const khipu = new KhipuClient(KHIPU_API_BASE, KHIPU_API_KEY);
const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Webhook de Khipu envía JSON (si alguna vez necesitas body en crudo, agrega otra ruta con raw parser)
app.use(morgan('dev'));

// Simulación de “DB” en memoria para la prueba
// En producción persistir en DB (transaction_id -> estado)
const orders = new Map<string, { paymentId?: string; status?: string }>();

app.get('/health', (_req, res) => res.json({ ok: true }));

// 1) Listar bancos
app.get('/api/banks', async (_req, res) => {
  try {
    const banks = await khipu.listBanks();
    res.json(banks);
  } catch (err: any) {
    console.error(err?.response?.data ?? err);
    res.status(502).json({ error: 'khipu_banks_failed' });
  }
});

// 2) Crear pago (monto ≤ 5000 CLP en DemoBank, según la prueba)
app.post('/api/payments', async (req, res) => {
  try {
    const body = req.body as Partial<CreatePaymentBody>;
    if (!body?.amount || !body?.transaction_id) {
      return res.status(400).json({ error: 'amount_and_transaction_id_required' });
    }
    if (body.amount > 5000) {
      return res.status(400).json({ error: 'demo_amount_limit_5000' });
    }

    const orderId = body.transaction_id;

    // Idempotencia básica
    const existing = orders.get(orderId);
    if (existing?.paymentId) {
      const payment = await khipu.getPaymentById(existing.paymentId);
      return res.json({
        paymentId: payment.payment_id,
        paymentUrl: payment.payment_url,
        status: payment.status
      });
    }

    // Construye URLs desde la base pública del backend
    const isPublicBase = /^https?:\/\//.test(PUBLIC_BASE_URL) && !/localhost|127(?:\.\d+){3}|\.local(?::|$)/.test(PUBLIC_BASE_URL);
    const returnUrl = body.return_url ?? `${PUBLIC_BASE_URL}/return`;
    const cancelUrl = body.cancel_url ?? `${PUBLIC_BASE_URL}/cancel`;
    const notifyUrl = isPublicBase ? `${PUBLIC_BASE_URL}/webhooks/khipu` : undefined;

    const payload = {
      subject: body.subject ?? `Orden ${orderId}`,
      amount: body.amount,
      currency: body.currency ?? 'CLP',
      transaction_id: orderId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      bank_id: body.bank_id,
    };

    let payment;
    try {
      payment = await khipu.createPayment(payload);
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const text = typeof data === 'string' ? data : JSON.stringify(data);
      const mentionsBank = /bank_id|bank|unknown|invalid/i.test(text || '');
      if (payload.bank_id && status === 400 && mentionsBank) {
        console.warn('Khipu rechazó bank_id, reintentando sin ese campo…');
        const { bank_id: _omit, ...payloadNoBank } = payload as any;
        payment = await khipu.createPayment(payloadNoBank);
      } else {
        throw err;
      }
    }

    orders.set(orderId, { paymentId: payment.payment_id, status: payment.status });

    res.json({
      paymentId: payment.payment_id,
      paymentUrl: payment.payment_url,
      status: payment.status
    });
  } catch (err: any) {
    console.error(err?.response?.data ?? err);
    const details = err?.response?.data ?? err?.message ?? String(err);
    res.status(502).json({ error: 'khipu_create_payment_failed', details });
  }
});

// 3) Consultar pago
app.get('/api/payments/:id', async (req, res) => {
  try {
    const payment = await khipu.getPaymentById(req.params.id);
    res.json(payment);
  } catch (err: any) {
    console.error(err?.response?.data ?? err);
    res.status(404).json({ error: 'payment_not_found' });
  }
});

// 4) Webhook Khipu
// Recomendación: responder 200 en <=30s, y confirmar estado llamando a GET /v3/payments/{id}
app.post('/webhooks/khipu', async (req, res) => {
  try {
    const { payment_id } = (req.body ?? {}) as { payment_id?: string };
    if (!payment_id) {
      // Si no viene ID, igual respondemos 200 para evitar reintentos masivos, pero logeamos
      console.warn('Webhook Khipu sin payment_id:', req.body);
      return res.status(200).send('ok');
    }

    const payment: KhipuPayment = await khipu.getPaymentById(payment_id);

    // Marca idempotente por transaction_id
    const orderId = payment.transaction_id;
    const current = orders.get(orderId) ?? {};
    orders.set(orderId, { ...current, paymentId: payment.payment_id, status: payment.status });

    // Aquí harías tu lógica de “orden pagada” sólo si payment.status === 'done'
    // (ej. actualizar DB, enviar correo, emitir factura, etc.)

    return res.status(200).send('ok');
  } catch (err: any) {
    console.error('Error en webhook:', err?.response?.data ?? err);
    // Respondemos 200 igualmente y dejamos la conciliación a un job/reintento controlado
    return res.status(200).send('ack');
  }
});

// Rutas de retorno/cancelación solo informativas para la demo
app.get('/return', (_req, res) => res.send('✅ Pago procesado, revisa tu backend para el estado final (webhook).'));
app.get('/cancel', (_req, res) => res.send('❌ Pago cancelado por el usuario.'));

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
