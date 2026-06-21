'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/api/axios';
import OrderQR from '@/components/OrderQR';
import ProtectedRoute from '@/components/ProtectedRoute';
import { formatDireccionDisplay } from '@/utils/formatAddress';
import {
  ENTREGA_MAX_HORAS,
  entregaVencida,
  formatTiempoRestante,
  getEntregaLimite,
  tiempoRestanteEntrega,
} from '@/utils/entrega';

const ESTADO_STYLES = {
  pendiente_pago: 'bg-escolar-coral/20 text-escolar-coral',
  pago_rechazado: 'bg-escolar-coral/20 text-escolar-coral',
  pendiente: 'bg-escolar-yellow/30 text-escolar-gold',
  confirmado: 'bg-escolar-sky text-escolar-blue',
  enviado: 'bg-escolar-mint text-escolar-green',
  entregado: 'bg-escolar-green/20 text-escolar-green',
};

function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatEstado(estado) {
  const labels = {
    pendiente_pago: 'Pendiente de pago',
    pago_rechazado: 'Pago rechazado',
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    enviado: 'Enviado',
    entregado: 'Entregado',
  };
  return labels[estado] || estado;
}

function MisPedidosContent() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState(null);

  async function handlePagar(pedidoId) {
    setPayingId(pedidoId);
    try {
      const { data } = await api.post(`/pagos/checkout/${pedidoId}`);
      if (data.checkout_url) {
        window.location.href = `/pedido/pago/checkout?url=${encodeURIComponent(data.checkout_url)}`;
        return;
      }
      setError('No se pudo abrir la pasarela de pago');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo abrir la pasarela de pago');
    } finally {
      setPayingId(null);
    }
  }

  useEffect(() => {
    async function loadPedidos() {
      try {
        await api.post('/pagos/sincronizar').catch(() => {});
        const { data } = await api.get('/pedidos');
        setPedidos(data);
      } catch {
        setError('No se pudieron cargar tus pedidos');
      } finally {
        setLoading(false);
      }
    }

    loadPedidos();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-escolar-sky border-t-escolar-navy" />
      </div>
    );
  }

  return (
    <div className="container-app page-section">
      <div className="mb-8 sm:mb-10">
        <h1 className="font-display text-2xl font-bold text-escolar-navy sm:text-3xl">
          Mis pedidos
        </h1>
        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          Revisa el estado de tus paquetes de útiles escolares
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-escolar-coral/10 px-4 py-3 text-sm text-escolar-coral">
          {error}
        </div>
      )}

      {!error && pedidos.length === 0 && (
        <div className="card text-center">
          <span className="mb-3 inline-block text-4xl sm:mb-4 sm:text-5xl">📭</span>
          <h2 className="mb-2 font-display text-lg font-bold text-escolar-navy sm:text-xl">
            Aún no tienes pedidos
          </h2>
          <p className="mb-5 text-sm text-gray-600 sm:mb-6">
            Explora nuestros paquetes y haz tu primer pedido
          </p>
          <Link href="/paquetes" className="btn-primary w-full sm:w-auto">
            Ver paquetes
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {pedidos.map((pedido) => (
          <article key={pedido.id} className="card overflow-visible">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-escolar-navy sm:text-lg">
                    {pedido.paquete_nombre}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold sm:px-3 ${
                      ESTADO_STYLES[pedido.estado] || ESTADO_STYLES.pendiente
                    }`}
                  >
                    {formatEstado(pedido.estado)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 sm:text-sm">
                  Pedido #{pedido.id} · {formatDate(pedido.created_at)}
                </p>
              </div>
              <p className="shrink-0 font-display text-xl font-bold text-escolar-green sm:text-2xl">
                {formatPrice(pedido.total)}
              </p>
            </div>

            <div className="mt-4 flex items-start gap-4 border-t border-escolar-sky pt-4 sm:gap-6">
              <div className="min-w-0 flex-1 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Estudiante
                  </p>
                  <p className="break-words text-sm text-escolar-navy">
                    {pedido.nombre_estudiante} — {pedido.grado_estudiante}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Escuela
                  </p>
                  <p className="break-words text-sm text-escolar-navy">{pedido.escuela}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Entrega
                  </p>
                  <p className="break-words text-sm text-escolar-navy">
                    {formatDireccionDisplay(pedido)}
                  </p>
                  {pedido.lat && pedido.lng && (
                    <p className="mt-1 text-xs text-gray-500">
                      📍 {Number(pedido.lat).toFixed(5)}, {Number(pedido.lng).toFixed(5)}
                    </p>
                  )}
                </div>
                {pedido.notas && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Notas
                    </p>
                    <p className="break-words text-sm text-escolar-navy">{pedido.notas}</p>
                  </div>
                )}
                {(pedido.pago_estado === 'approved' && pedido.codigo_qr) &&
                  pedido.pagado_at &&
                  pedido.estado !== 'entregado' && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Plazo de entrega
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          entregaVencida(pedido.pagado_at, pedido.estado)
                            ? 'text-escolar-coral'
                            : 'text-escolar-navy'
                        }`}
                      >
                        Máximo {ENTREGA_MAX_HORAS} horas —{' '}
                        {formatDateTime(getEntregaLimite(pedido.pagado_at)?.toISOString())}
                        {!entregaVencida(pedido.pagado_at, pedido.estado) && (
                          <span className="ml-1 text-xs font-normal text-gray-500">
                            ({formatTiempoRestante(
                              tiempoRestanteEntrega(pedido.pagado_at, pedido.estado)
                            )})
                          </span>
                        )}
                      </p>
                      {pedido.fecha_entrega_programada && (
                        <p className="mt-1 text-xs text-gray-600">
                          Programada: {formatDateTime(pedido.fecha_entrega_programada)}
                        </p>
                      )}
                    </div>
                  )}
              </div>

              <div className="flex shrink-0 flex-col items-center justify-center gap-3 rounded-xl bg-escolar-chalk/60 p-3 sm:p-4">
                {(pedido.pago_estado === 'approved' && pedido.codigo_qr) && (
                  <OrderQR pedido={pedido} size={100} showLabel />
                )}
                {(pedido.estado === 'pendiente_pago' || pedido.estado === 'pago_rechazado') && (
                  <button
                    type="button"
                    onClick={() => handlePagar(pedido.id)}
                    disabled={payingId === pedido.id}
                    className="btn-accent whitespace-nowrap px-4 py-2 text-sm"
                  >
                    {payingId === pedido.id ? 'Abriendo pago...' : 'Pagar ahora'}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function MisPedidosPage() {
  return (
    <ProtectedRoute>
      <MisPedidosContent />
    </ProtectedRoute>
  );
}
