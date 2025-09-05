# Khipu Instant Payments — Demo

Demo de pagos instantáneos con Khipu usando:
- Frontend: React + Vite + Tailwind
- Backend: Express + TypeScript

Incluye un flujo de pago por redirección a Khipu, página de retorno con estados y un backend que actúa como proxy seguro a la API de Khipu.

## Estructura

- `frontend/`: interfaz de usuario (checkout y return)
- `backend/`: API y webhooks

## Requisitos

- Node.js 18+

## Configuración

Completa las variables en cada carpeta (ver `.env.example`).

- Backend:
  - `KHIPU_API_BASE`
  - `KHIPU_API_KEY`
  - `PUBLIC_BASE_URL`
  - `PORT`
- Frontend:
  - `VITE_API_BASE`
  - `VITE_KHIPU_LOGO_URL`
  - `VITE_KHIPU_LOGO_HEADER_URL`
  - `VITE_KHIPU_BADGE_URL`
  - `VITE_KHIPU_TRUST_BADGE_URL`

## Desarrollo local

- Instalar dependencias en el monorepo:
  - `npm install`
- Levantar backend y frontend en paralelo:
  - `npm run dev`

Frontend: http://localhost:5173
Backend: http://localhost:3000

## Producción

- Backend: `npm run build && npm start`
- Frontend: `npm run build` y servir `frontend/dist` en hosting estático.

## Webhooks

Para recibir webhooks en local, expón el backend con un túnel HTTPS (ngrok o cloudflared) y configura `PUBLIC_BASE_URL` con la URL pública.

## Licencia

MIT
