'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import api from '@/api/axios';
import OrderQR from '@/components/OrderQR';
import ProtectedRoute from '@/components/ProtectedRoute';

function PagoExitoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pedidoId = searchParams.get('pedido_id');
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pedidoId) {
      setError('No se encontró el pedido');
      setLoading(false);
      return;
    }

    const params = paymentId ? `?payment_id=${encodeURIComponent(paymentId)}` : '';

    api
      .get(`/pagos/verificar/${pedidoId}${params}`)
      .then(({ data }) => {
        if (data.pago_estado === 'rejected') {
          router.replace(`/pedido/pago/error?pedido_id=${pedidoId}`);
          return;
        }
        if (data.pago_estado === 'pending') {
          router.replace(`/pedido/pago/pendiente?pedido_id=${pedidoId}`);
          return;
        }
        setPedido(data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'No se pudo verificar el pago');
      })
      .finally(() => setLoading(false));
  }, [pedidoId, paymentId, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-escolar-sky border-t-escolar-navy" />
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="container-app page-section text-center">
        <p className="text-escolar-coral">{error || 'Pedido no encontrado'}</p>
        <Link href="/mis-pedidos" className="btn-primary mt-4 inline-flex">
          Ver mis pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app page-section">
      <div className="card mx-auto max-w-lg text-center">
        <span className="mb-3 inline-block text-4xl sm:mb-4 sm:text-5xl">🎉</span>
        <h1 className="mb-2 font-display text-xl font-bold text-escolar-green sm:text-2xl">
          ¡Pago confirmado!
        </h1>
        <p className="mb-4 text-sm text-gray-600 sm:mb-5">
          Tu pedido <strong>#{pedido.id}</strong> fue pagado correctamente. Guarda este código QR.
        </p>
        <div className="mb-5 flex justify-center sm:mb-6">
          <OrderQR pedido={pedido} size={180} showLabel />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/mis-pedidos" className="btn-primary w-full sm:w-auto">
            Ver mis pedidos
          </Link>
          <Link href="/paquetes" className="btn-secondary w-full sm:w-auto">
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PagoExitoPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-escolar-sky border-t-escolar-navy" />
          </div>
        }
      >
        <PagoExitoContent />
      </Suspense>
    </ProtectedRoute>
  );
}
