'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

function PagoPendienteContent() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('pedido_id');

  return (
    <div className="container-app page-section">
      <div className="card mx-auto max-w-lg text-center">
        <span className="mb-3 inline-block text-4xl sm:mb-4 sm:text-5xl">⏳</span>
        <h1 className="mb-2 font-display text-xl font-bold text-escolar-navy sm:text-2xl">
          Pago en proceso
        </h1>
        <p className="mb-5 text-sm text-gray-600 sm:mb-6">
          {pedidoId
            ? `El pago del pedido #${pedidoId} está pendiente de confirmación. Te avisaremos cuando se acredite.`
            : 'Tu pago está pendiente de confirmación.'}
        </p>
        <Link href="/mis-pedidos" className="btn-primary inline-flex w-full sm:w-auto">
          Ver mis pedidos
        </Link>
      </div>
    </div>
  );
}

export default function PagoPendientePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <PagoPendienteContent />
      </Suspense>
    </ProtectedRoute>
  );
}
