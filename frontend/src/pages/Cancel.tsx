export default function Cancel() {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-red-700">❌ Pago cancelado</h1>
      <p className="text-sm text-gray-600 mt-2">Has cancelado el proceso de pago. Puedes volver a intentarlo cuando quieras.</p>
      <a href="/" className="mt-4 inline-flex text-sm text-gray-700 underline">← Volver al inicio</a>
    </div>
  );
}
