'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/api/axios';
import OrderQR from '@/components/OrderQR';
import { formatDireccionDisplay } from '@/utils/formatAddress';
import {
  ENTREGA_MAX_HORAS,
  entregaVencida,
  formatTiempoRestante,
  getEntregaLimite,
  tiempoRestanteEntrega,
} from '@/utils/entrega';

const ESTADO_STYLES = {
  confirmado: 'bg-escolar-sky text-escolar-blue',
  enviado: 'bg-escolar-mint text-escolar-green',
  entregado: 'bg-escolar-green/20 text-escolar-green',
};

const FILTROS = [
  { id: 'todos', label: 'Pagados' },
  { id: 'por_entregar', label: 'Por programar' },
  { id: 'programados', label: 'Programados' },
  { id: 'vencidos', label: 'Plazo vencido' },
  { id: 'enviados', label: 'Enviados' },
  { id: 'entregados', label: 'Entregados' },
];

function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
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
    confirmado: 'Pagado',
    enviado: 'Enviado',
    entregado: 'Entregado',
  };
  return labels[estado] || estado;
}

function toInputDateTimeValue(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function PedidoCajaCard({ pedido, onUpdated }) {
  const limiteEntrega = getEntregaLimite(pedido.pagado_at);
  const vencido = entregaVencida(pedido.pagado_at, pedido.estado);
  const tiempoRestante = tiempoRestanteEntrega(pedido.pagado_at, pedido.estado);
  const minFecha = pedido.pagado_at ? toInputDateTimeValue(pedido.pagado_at) : '';
  const maxFecha = limiteEntrega ? toInputDateTimeValue(limiteEntrega.toISOString()) : '';

  const [fecha, setFecha] = useState(
    toInputDateTimeValue(pedido.fecha_entrega_programada) ||
      (limiteEntrega ? toInputDateTimeValue(limiteEntrega.toISOString()) : '')
  );
  const [notasEntrega, setNotasEntrega] = useState(pedido.notas_entrega || '');
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');

  async function handleProgramar(e) {
    e.preventDefault();
    if (!fecha) {
      setError('Selecciona fecha y hora de entrega');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch(`/admin/caja/pedidos/${pedido.id}/programar`, {
        fecha_entrega_programada: new Date(fecha).toISOString(),
        notas_entrega: notasEntrega,
      });
      onUpdated(data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo programar la entrega');
    } finally {
      setSaving(false);
    }
  }

  async function handleEstado(estado) {
    setActionId(estado);
    setError('');
    try {
      const { data } = await api.patch(`/admin/caja/pedidos/${pedido.id}/estado`, { estado });
      onUpdated(data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el estado');
    } finally {
      setActionId('');
    }
  }

  const cliente = [pedido.cliente_nombre, pedido.cliente_apellido].filter(Boolean).join(' ');

  return (
    <article className={`card overflow-visible ${vencido ? 'ring-2 ring-escolar-coral/40' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-escolar-navy sm:text-lg">
              Pedido #{pedido.id} · {pedido.paquete_nombre}
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                ESTADO_STYLES[pedido.estado] || ESTADO_STYLES.confirmado
              }`}
            >
              {formatEstado(pedido.estado)}
            </span>
          </div>
          <p className="text-xs text-gray-600 sm:text-sm">
            Pagado {formatDateTime(pedido.pagado_at || pedido.created_at)}
            {pedido.mp_payment_id && (
              <span className="ml-2 text-gray-400">· MP {pedido.mp_payment_id}</span>
            )}
          </p>
          {pedido.pagado_at && pedido.estado !== 'entregado' && (
            <p
              className={`mt-1 text-xs font-semibold ${
                vencido ? 'text-escolar-coral' : 'text-escolar-blue'
              }`}
            >
              {vencido
                ? `Plazo de ${ENTREGA_MAX_HORAS}h vencido — entregar urgente`
                : `Entrega máxima: ${formatDateTime(limiteEntrega?.toISOString())} (${formatTiempoRestante(tiempoRestante)})`}
            </p>
          )}
        </div>
        <p className="shrink-0 font-display text-xl font-bold text-escolar-green sm:text-2xl">
          {formatPrice(pedido.total)}
        </p>
      </div>

      <div className="mt-4 grid gap-4 border-t border-escolar-sky pt-4 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cliente</p>
            <p className="text-sm text-escolar-navy">{cliente}</p>
            <p className="text-xs text-gray-600">{pedido.cliente_email}</p>
            {pedido.cliente_telefono && (
              <p className="text-xs text-gray-600">{pedido.cliente_telefono}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Estudiante</p>
            <p className="text-sm text-escolar-navy">
              {pedido.nombre_estudiante} — {pedido.grado_estudiante}
            </p>
            <p className="text-xs text-gray-600">{pedido.escuela}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Entrega</p>
            <p className="text-sm text-escolar-navy">{formatDireccionDisplay(pedido)}</p>
          </div>
          {pedido.fecha_entrega_programada && (
            <div className="sm:col-span-2 rounded-lg bg-escolar-sky/40 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-escolar-blue">
                Entrega programada
              </p>
              <p className="text-sm font-medium text-escolar-navy">
                {formatDateTime(pedido.fecha_entrega_programada)}
              </p>
              {pedido.notas_entrega && (
                <p className="mt-1 text-xs text-gray-600">{pedido.notas_entrega}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-3 rounded-xl bg-escolar-chalk/60 p-3 sm:p-4">
          <OrderQR pedido={pedido} size={90} showLabel />
        </div>
      </div>

      {(pedido.estado === 'confirmado' || pedido.estado === 'enviado') && (
        <div className="mt-4 border-t border-escolar-sky pt-4">
          {pedido.estado === 'confirmado' && (
            <form onSubmit={handleProgramar} className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`fecha-${pedido.id}`} className="mb-1 block text-xs font-semibold text-gray-500">
                  Fecha y hora de entrega
                </label>
                <input
                  id={`fecha-${pedido.id}`}
                  type="datetime-local"
                  value={fecha}
                  min={minFecha}
                  max={maxFecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-lg border border-escolar-sky px-3 py-2 text-sm"
                />
                {limiteEntrega && (
                  <p className="mt-1 text-xs text-gray-500">
                    Máximo {ENTREGA_MAX_HORAS} horas desde el pago ({formatDateTime(limiteEntrega.toISOString())})
                  </p>
                )}
              </div>
              <div>
                <label htmlFor={`notas-${pedido.id}`} className="mb-1 block text-xs font-semibold text-gray-500">
                  Notas de entrega (opcional)
                </label>
                <input
                  id={`notas-${pedido.id}`}
                  type="text"
                  value={notasEntrega}
                  onChange={(e) => setNotasEntrega(e.target.value)}
                  placeholder="Ej. Entregar por la mañana"
                  className="w-full rounded-lg border border-escolar-sky px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <button type="submit" disabled={saving} className="btn-primary py-2 text-sm">
                  {saving ? 'Guardando...' : 'Programar entrega'}
                </button>
                {pedido.fecha_entrega_programada && (
                  <button
                    type="button"
                    onClick={() => handleEstado('enviado')}
                    disabled={actionId === 'enviado'}
                    className="btn-accent py-2 text-sm"
                  >
                    {actionId === 'enviado' ? 'Marcando...' : 'Marcar como enviado'}
                  </button>
                )}
              </div>
            </form>
          )}

          {pedido.estado === 'enviado' && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleEstado('entregado')}
                disabled={actionId === 'entregado'}
                className="btn-primary py-2 text-sm"
              >
                {actionId === 'entregado' ? 'Marcando...' : 'Marcar como entregado'}
              </button>
              <button
                type="button"
                onClick={() => handleEstado('confirmado')}
                disabled={actionId === 'confirmado'}
                className="btn-secondary py-2 text-sm"
              >
                Volver a confirmado
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-escolar-coral/10 px-3 py-2 text-sm text-escolar-coral">{error}</p>
          )}
        </div>
      )}
    </article>
  );
}

export default function CajaPage() {
  const [filtro, setFiltro] = useState('todos');
  const [pedidos, setPedidos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (activeFiltro) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/admin/caja/sincronizar').catch(() => {});
      const [resumenRes, pedidosRes] = await Promise.all([
        api.get('/admin/caja/resumen'),
        api.get(`/admin/caja/pedidos?filtro=${activeFiltro}`),
      ]);
      setResumen(resumenRes.data);
      setPedidos(pedidosRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar la caja');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(filtro);
  }, [filtro, loadData]);

  function handlePedidoUpdated(updated) {
    setPedidos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    loadData(filtro);
  }

  return (
    <div className="container-app page-section">
      <div className="mb-8 sm:mb-10">
        <h1 className="font-display text-2xl font-bold text-escolar-navy sm:text-3xl">
          Caja y entregas
        </h1>
        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          Solo pedidos pagados con QR. Entrega máxima {ENTREGA_MAX_HORAS} horas desde el pago.
        </p>
      </div>

      {resumen && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="card bg-escolar-sky/30 py-4">
            <p className="text-xs font-semibold uppercase text-escolar-blue">Ingresos</p>
            <p className="font-display text-2xl font-bold text-escolar-navy">
              {formatPrice(resumen.ingresos)}
            </p>
            <p className="text-xs text-gray-600">{resumen.pagados} pedidos pagados</p>
          </div>
          <div className="card py-4">
            <p className="text-xs font-semibold uppercase text-gray-400">Por programar</p>
            <p className="font-display text-2xl font-bold text-escolar-coral">
              {resumen.por_programar}
            </p>
          </div>
          <div className="card py-4">
            <p className="text-xs font-semibold uppercase text-gray-400">Programados</p>
            <p className="font-display text-2xl font-bold text-escolar-navy">
              {resumen.programados}
            </p>
          </div>
          <div className="card py-4">
            <p className="text-xs font-semibold uppercase text-gray-400">Plazo vencido</p>
            <p className="font-display text-2xl font-bold text-escolar-coral">{resumen.vencidos}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs font-semibold uppercase text-gray-400">En camino / entregados</p>
            <p className="font-display text-2xl font-bold text-escolar-green">
              {resumen.enviados + resumen.entregados}
            </p>
            <p className="text-xs text-gray-600">
              {resumen.enviados} enviados · {resumen.entregados} entregados
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTROS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFiltro(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filtro === item.id
                ? 'bg-escolar-navy text-white'
                : 'bg-escolar-sky/50 text-escolar-navy hover:bg-escolar-sky'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-escolar-coral/10 px-4 py-3 text-sm text-escolar-coral">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-escolar-sky border-t-escolar-navy" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="card text-center">
          <span className="mb-3 inline-block text-4xl">📋</span>
          <h2 className="font-display text-lg font-bold text-escolar-navy">Sin pedidos en esta vista</h2>
          <p className="mt-2 text-sm text-gray-600">
            Aquí aparecen pedidos con pago confirmado y código QR. Los pendientes de pago no se listan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <PedidoCajaCard key={pedido.id} pedido={pedido} onUpdated={handlePedidoUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}
