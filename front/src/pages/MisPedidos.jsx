import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import OrderQR from '../components/OrderQR';

const ESTADO_STYLES = {
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

export default function MisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/pedidos')
      .then(({ data }) => setPedidos(data))
      .catch(() => setError('No se pudieron cargar tus pedidos'))
      .finally(() => setLoading(false));
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
          <Link to="/paquetes" className="btn-primary w-full sm:w-auto">
            Ver paquetes
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {pedidos.map((pedido) => (
          <article key={pedido.id} className="card overflow-visible">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-escolar-navy sm:text-lg">
                    {pedido.paquete_nombre}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize sm:px-3 ${
                      ESTADO_STYLES[pedido.estado] || ESTADO_STYLES.pendiente
                    }`}
                  >
                    {pedido.estado}
                  </span>
                </div>
                <p className="text-xs text-gray-600 sm:text-sm">
                  Pedido #{pedido.id} · {formatDate(pedido.created_at)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl bg-escolar-chalk/60 p-4 sm:justify-end lg:min-w-[220px] lg:flex-col lg:items-center">
                <OrderQR pedido={pedido} size={100} showLabel />
                <p className="shrink-0 font-display text-xl font-bold text-escolar-green sm:text-2xl">
                  {formatPrice(pedido.total)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 border-t border-escolar-sky pt-4 sm:grid-cols-2">
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
                <p className="break-words text-sm text-escolar-navy">{pedido.direccion_entrega}</p>
              </div>
              {pedido.notas && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Notas
                  </p>
                  <p className="break-words text-sm text-escolar-navy">{pedido.notas}</p>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
