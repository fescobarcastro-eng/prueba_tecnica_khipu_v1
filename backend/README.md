# Backend (Express + TypeScript) — Khipu Instant Payments Demo

API mínima para integrar Pagos Instantáneos (v3) de Khipu y servir como companion del frontend.

## Endpoints

- `GET /health`: verificación de vida.
- `GET /api/banks`: proxy a `GET /v3/banks` (requiere `KHIPU_API_KEY`).
- `POST /api/payments`: crea pago (monto demo ≤ 5000 CLP, idempotencia por `transaction_id`). Retorna `{ paymentId, paymentUrl, status }`.
- `GET /api/payments/:id`: consulta pago por `payment_id`.
- `POST /webhooks/khipu`: recibe webhook y confirma estado consultando a Khipu.

## Configuración

Variables en `backend/.env` (ver `backend/.env.example`):
- `KHIPU_API_BASE` (por defecto `https://payment-api.khipu.com`)
- `KHIPU_API_KEY`
- `PUBLIC_BASE_URL` (necesaria para `notify_url` en HTTPS público)
- `PORT`

## Flujo (redirección)

1) Frontend crea pago vía `POST /api/payments`.
2) Cliente redirige a `paymentUrl` de Khipu.
3) Khipu envía webhook a `/webhooks/khipu`.
4) Frontend consulta `/api/payments/:id` en `/return` hasta estado final.

## Ejecutar

Requisitos: Node 18+

1) `cp backend/.env.example backend/.env` y configurar variables.
2) `npm install`
3) Dev: `npm run dev`
4) Prod: `npm run build && npm start`

## Notas

- `notify_url` sólo se envía si `PUBLIC_BASE_URL` es pública (no localhost).
- Para probar webhooks en local, usar túnel HTTPS (ngrok o cloudflared) y setear `PUBLIC_BASE_URL`.

## Licencia

MIT
