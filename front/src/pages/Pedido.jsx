import { Form, Formik } from 'formik';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import FormField from '../components/FormField';
import OrderQR from '../components/OrderQR';
import { pedidoSchema } from '../validation/schemas';

const GRADOS = [
  { value: '', label: 'Selecciona el grado' },
  { value: 'Preescolar', label: 'Preescolar' },
  { value: '1° Primaria', label: '1° Primaria' },
  { value: '2° Primaria', label: '2° Primaria' },
  { value: '3° Primaria', label: '3° Primaria' },
  { value: '4° Primaria', label: '4° Primaria' },
  { value: '5° Primaria', label: '5° Primaria' },
  { value: '6° Primaria', label: '6° Primaria' },
  { value: '1° Secundaria', label: '1° Secundaria' },
  { value: '2° Secundaria', label: '2° Secundaria' },
  { value: '3° Secundaria', label: '3° Secundaria' },
];

function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price);
}

export default function Pedido() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paquete, setPaquete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(null);

  useEffect(() => {
    api
      .get(`/paquetes/${id}`)
      .then(({ data }) => setPaquete(data))
      .catch(() => setServerError('Paquete no encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-escolar-sky border-t-escolar-navy" />
      </div>
    );
  }

  if (!paquete) {
    return (
      <div className="container-app py-12 text-center sm:py-16">
        <p className="text-escolar-coral">{serverError || 'Paquete no disponible'}</p>
        <Link to="/paquetes" className="btn-primary mt-4 inline-flex w-full sm:w-auto">
          Volver a paquetes
        </Link>
      </div>
    );
  }

  const contenido = Array.isArray(paquete.contenido) ? paquete.contenido : [];

  return (
    <div className="container-app page-section">
      <Link
        to="/paquetes"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-escolar-blue hover:underline sm:mb-6"
      >
        ← Volver a paquetes
      </Link>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="card lg:sticky lg:top-24">
            <div
              className="mb-4 h-2 rounded-full"
              style={{ backgroundColor: paquete.imagen_color }}
            />
            <span
              className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: paquete.imagen_color }}
            >
              {paquete.grado}
            </span>
            <h1 className="mb-2 font-display text-xl font-bold text-escolar-navy sm:text-2xl">
              {paquete.nombre}
            </h1>
            <p className="mb-4 text-2xl font-extrabold text-escolar-green sm:text-3xl">
              {formatPrice(paquete.precio)}
            </p>
            <p className="mb-4 text-sm text-gray-600">{paquete.descripcion}</p>
            <h3 className="mb-2 font-display font-bold text-escolar-navy">Incluye:</h3>
            <ul className="space-y-1">
              {contenido.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-700">
                  <span className="shrink-0 text-escolar-yellow">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card">
            <h2 className="mb-1 font-display text-lg font-bold text-escolar-navy sm:text-xl">
              Datos del pedido
            </h2>
            <p className="mb-5 text-sm text-gray-600 sm:mb-6">
              Completa la información del estudiante y la entrega
            </p>

            {success && pedidoCreado ? (
              <div className="rounded-2xl bg-escolar-mint p-5 text-center sm:p-8">
                <span className="mb-3 inline-block text-4xl sm:mb-4 sm:text-5xl">🎉</span>
                <h3 className="mb-2 font-display text-lg font-bold text-escolar-green sm:text-xl">
                  ¡Pedido realizado con éxito!
                </h3>
                <p className="mb-4 text-sm text-gray-600 sm:mb-5">
                  Guarda este código QR para consultar o recoger tu pedido.
                </p>

                <div className="mb-5 flex justify-center sm:mb-6">
                  <OrderQR pedido={pedidoCreado} size={180} showLabel />
                </div>

                <p className="mb-5 text-sm text-gray-600 sm:mb-6">
                  También lo encontrarás en <strong>Mis pedidos</strong>.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => navigate('/mis-pedidos')}
                    className="btn-primary w-full sm:w-auto"
                  >
                    Ver mis pedidos
                  </button>
                  <Link to="/paquetes" className="btn-secondary w-full sm:w-auto">
                    Seguir comprando
                  </Link>
                </div>
              </div>
            ) : success ? null : (
              <Formik
                initialValues={{
                  cantidad: 1,
                  nombre_estudiante: '',
                  grado_estudiante: '',
                  escuela: '',
                  direccion_entrega: '',
                  notas: '',
                }}
                validationSchema={pedidoSchema}
                onSubmit={async (values, { setSubmitting }) => {
                  setServerError('');
                  try {
                    const { data } = await api.post('/pedidos', {
                      paquete_id: Number(paquete.id),
                      cantidad: Number(values.cantidad),
                      nombre_estudiante: values.nombre_estudiante,
                      grado_estudiante: values.grado_estudiante,
                      escuela: values.escuela,
                      direccion_entrega: values.direccion_entrega,
                      notas: values.notas,
                    });
                    setPedidoCreado({
                      ...data,
                      paquete_nombre: data.paquete_nombre || paquete.nombre,
                      paquete_grado: data.paquete_grado || paquete.grado,
                    });
                    setSuccess(true);
                  } catch (err) {
                    const status = err.response?.status;
                    const msg = err.response?.data?.message;

                    if (status === 401) {
                      setServerError('Tu sesión expiró. Inicia sesión de nuevo.');
                    } else {
                      setServerError(msg || 'Error al crear el pedido');
                    }
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({ values, isSubmitting }) => (
                  <Form>
                    <FormField
                      label="Cantidad de paquetes"
                      name="cantidad"
                      type="number"
                      placeholder="1"
                    />
                    <FormField
                      label="Nombre del estudiante"
                      name="nombre_estudiante"
                      placeholder="Nombre completo del alumno"
                    />
                    <FormField
                      label="Grado del estudiante"
                      name="grado_estudiante"
                      as="select"
                      options={GRADOS}
                    />
                    <FormField
                      label="Escuela"
                      name="escuela"
                      placeholder="Nombre de la escuela"
                    />
                    <FormField
                      label="Dirección de entrega"
                      name="direccion_entrega"
                      as="textarea"
                      rows={3}
                      placeholder="Calle, número, colonia, ciudad, CP"
                    />
                    <FormField
                      label="Notas adicionales (opcional)"
                      name="notas"
                      as="textarea"
                      rows={2}
                      placeholder="Instrucciones especiales de entrega"
                    />

                    <div className="mb-5 rounded-xl bg-escolar-sky/50 px-4 py-3 sm:mb-6">
                      <p className="text-sm text-gray-600">Total estimado</p>
                      <p className="font-display text-xl font-bold text-escolar-navy sm:text-2xl">
                        {formatPrice(Number(paquete.precio) * (Number(values.cantidad) || 1))}
                      </p>
                    </div>

                    {serverError && (
                      <div className="mb-4 rounded-xl bg-escolar-coral/10 px-4 py-3 text-sm text-escolar-coral">
                        {serverError}
                      </div>
                    )}

                    <button type="submit" disabled={isSubmitting} className="btn-accent w-full">
                      {isSubmitting ? 'Procesando pedido...' : 'Confirmar pedido'}
                    </button>
                  </Form>
                )}
              </Formik>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
