# Frontend (React + Vite + Tailwind) — Khipu Instant Payments Demo

Interfaz de checkout y página de retorno para pagos instantáneos con Khipu.

## Rutas

- `/` (Checkout): Selección de monto (demo ≤ $5.000 CLP) y creación de pago.
- `/return`: Muestra estado del pago (polling), pasos y, cuando aplica, enlace a comprobante.
- `/cancel`: Mensaje si el usuario aborta el flujo.

Nota: Se retiró la ruta experimental `/embedded`. El flujo actual funciona únicamente por redirección a Khipu.

## Variables de entorno

Definir en `frontend/.env` (ver `frontend/.env.example`):
- `VITE_API_BASE`: URL del backend Express.
- `VITE_KHIPU_LOGO_URL`: URL (S3) del logo.
- `VITE_KHIPU_LOGO_HEADER_URL`: Variante para header (si aplica).
- `VITE_KHIPU_BADGE_URL`: Badge/trust badge.
- `VITE_KHIPU_TRUST_BADGE_URL`: Badge alternativo (opcional).

Política de assets: sólo URLs provistas (S3). Si una imagen falla, se oculta.

## Flujo

- El checkout crea el pago vía backend y redirige a `payment_url` de Khipu.
- La página `/return` confirma estado consultando el backend con `payment_id`.

## Ejecutar

Requisitos: Node 18+

1) `cp frontend/.env.example frontend/.env` y configurar variables.
2) `npm install`
3) Dev: `npm run dev`
4) Build: `npm run build && npm run preview`

## Licencia

MIT
