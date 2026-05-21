import { Link } from 'react-router-dom';

function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price);
}

export default function PackageCard({ paquete }) {
  const contenido = Array.isArray(paquete.contenido) ? paquete.contenido : [];

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition hover:shadow-cardHover sm:hover:-translate-y-1">
      <div
        className="relative h-2 sm:h-3"
        style={{ backgroundColor: paquete.imagen_color || '#1E3A5F' }}
      />
      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 flex-1">
            <span
              className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white sm:px-3 sm:py-1"
              style={{ backgroundColor: paquete.imagen_color || '#1E3A5F' }}
            >
              {paquete.grado}
            </span>
            <h3 className="font-display text-lg font-bold text-escolar-navy sm:text-xl">
              {paquete.nombre}
            </h3>
          </div>
          <p className="shrink-0 font-display text-xl font-extrabold text-escolar-green sm:text-2xl">
            {formatPrice(paquete.precio)}
          </p>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-gray-600">{paquete.descripcion}</p>

        <ul className="mb-5 space-y-1.5 sm:mb-6">
          {contenido.slice(0, 4).map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-escolar-navy/80">
              <span className="shrink-0 text-escolar-yellow">✓</span>
              <span>{item}</span>
            </li>
          ))}
          {contenido.length > 4 && (
            <li className="text-sm font-medium text-escolar-blue">
              + {contenido.length - 4} artículos más
            </li>
          )}
        </ul>

        <Link
          to={`/pedido/${paquete.id}`}
          className="btn-primary mt-auto w-full text-center"
        >
          Pedir este paquete
        </Link>
      </div>
    </article>
  );
}
