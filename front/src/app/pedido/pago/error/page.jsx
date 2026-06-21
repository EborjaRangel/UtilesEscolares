'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

function PagoErrorContent() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('pedido_id');

  return (
    <div className="container-app page-section">
      <div className="card mx-auto max-w-lg text-center">
        <span className="mb-3 inline-block text-4xl sm:mb-4 sm:text-5xl">😕</span>
        <h1 className="mb-2 font-display text-xl font-bold text-escolar-coral sm:text-2xl">
          Pago no completado
        </h1>
        <p className="mb-5 text-sm text-gray-600 sm:mb-6">
          {pedidoId
            ? `El pago del pedido #${pedidoId} no se realizó. Puedes intentarlo de nuevo desde Mis pedidos.`
            : 'El pago no se completó. Intenta de nuevo.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/mis-pedidos" className="btn-primary w-full sm:w-auto">
            Ver mis pedidos
          </Link>
          <Link href="/paquetes" className="btn-secondary w-full sm:w-auto">
            Volver a paquetes
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PagoErrorPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <PagoErrorContent />
      </Suspense>
    </ProtectedRoute>
  );
}
