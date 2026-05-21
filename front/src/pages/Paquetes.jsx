import { useEffect, useState } from 'react';
import api from '../api/axios';
import PackageCard from '../components/PackageCard';

export default function Paquetes() {
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/paquetes')
      .then(({ data }) => setPaquetes(data))
      .catch(() => setError('No se pudieron cargar los paquetes'))
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
      <div className="mb-8 text-center sm:mb-10">
        <span className="mb-3 inline-block rounded-full bg-escolar-yellow/30 px-3 py-1 text-xs font-semibold text-escolar-navy sm:px-4 sm:py-1.5 sm:text-sm">
          📦 Catálogo escolar
        </span>
        <h1 className="font-display text-2xl font-bold text-escolar-navy sm:text-3xl lg:text-4xl">
          Paquetes de útiles por grado
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
          Cada paquete incluye todos los materiales necesarios para el ciclo escolar.
          Selecciona el grado de tu hijo y pide con un solo clic.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-escolar-coral/10 px-4 py-3 text-center text-sm text-escolar-coral sm:text-base">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-2">
        {paquetes.map((paquete) => (
          <PackageCard key={paquete.id} paquete={paquete} />
        ))}
      </div>
    </div>
  );
}
