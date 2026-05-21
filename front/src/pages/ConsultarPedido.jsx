import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DetailItem({ label, value }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 break-words text-sm text-escolar-navy sm:text-base">{value}</p>
    </div>
  );
}

export default function ConsultarPedido() {
  const { codigo } = useParams();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/pedidos/consulta/${codigo}`)
      .then(({ data }) => setPedido(data))
      .catch(() => setError('No se encontró el pedido con este código QR'))
      .finally(() => setLoading(false));
  }, [codigo]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-escolar-sky border-t-escolar-navy" />
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="container-app py-16 text-center">
        <span className="mb-4 inline-block text-5xl">❌</span>
        <h1 className="mb-2 font-display text-xl font-bold text-escolar-navy">Pedido no encontrado</h1>
        <p className="mb-6 text-gray-600">{error}</p>
        <Link to="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const contenido = Array.isArray(pedido.paquete_contenido) ? pedido.paquete_contenido : [];

  return (
    <div className="container-app page-section">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <span className="mb-3 inline-block rounded-full bg-escolar-mint px-4 py-1.5 text-sm font-semibold text-escolar-green">
            📋 Detalle del pedido
          </span>
          <h1 className="font-display text-2xl font-bold text-escolar-navy sm:text-3xl">
            {pedido.paquete_nombre}
          </h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Código: <strong>{pedido.codigo_qr}</strong>
          </p>
        </div>

        <div className="card mb-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 text-center sm:text-left">
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                    ESTADO_STYLES[pedido.estado] || ESTADO_STYLES.pendiente
                  }`}
                >
                  {pedido.estado}
                </span>
                <span className="text-sm text-gray-500">Pedido #{pedido.id}</span>
              </div>
              <p className="font-display text-3xl font-extrabold text-escolar-green">
                {formatPrice(pedido.total)}
              </p>
              <p className="mt-1 text-sm text-gray-500">{formatDate(pedido.created_at)}</p>
            </div>
            <OrderQR pedido={pedido} size={120} showLabel showCode={false} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="card space-y-4">
            <h2 className="font-display text-lg font-bold text-escolar-navy">Datos del estudiante</h2>
            <DetailItem label="Nombre" value={pedido.nombre_estudiante} />
            <DetailItem label="Grado" value={pedido.grado_estudiante} />
            <DetailItem label="Escuela" value={pedido.escuela} />
          </div>

          <div className="card space-y-4">
            <h2 className="font-display text-lg font-bold text-escolar-navy">Entrega y contacto</h2>
            <DetailItem label="Dirección de entrega" value={pedido.direccion_entrega} />
            <DetailItem
              label="Cliente"
              value={`${pedido.cliente_nombre} ${pedido.cliente_apellido}`}
            />
            <DetailItem label="Correo" value={pedido.cliente_email} />
            <DetailItem label="Teléfono" value={pedido.cliente_telefono || 'No registrado'} />
            <DetailItem label="Notas" value={pedido.notas} />
          </div>
        </div>

        <div className="card mt-6">
          <h2 className="mb-4 font-display text-lg font-bold text-escolar-navy">Paquete solicitado</h2>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-escolar-navy">{pedido.paquete_nombre}</p>
              <p className="text-sm text-gray-600">{pedido.paquete_grado}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Cantidad: {pedido.cantidad}</p>
              <p className="text-sm font-semibold text-escolar-blue">
                {formatPrice(pedido.paquete_precio)} c/u
              </p>
            </div>
          </div>
          <p className="mb-4 text-sm text-gray-600">{pedido.paquete_descripcion}</p>
          <h3 className="mb-2 text-sm font-bold text-escolar-navy">Contenido del paquete:</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {contenido.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="shrink-0 text-escolar-yellow">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link to="/paquetes" className="btn-primary">
            Ver paquetes
          </Link>
        </div>
      </div>
    </div>
  );
}
