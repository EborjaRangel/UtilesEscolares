'use client';

import { Form, Formik } from 'formik';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/api/axios';
import ColoniaField from '@/components/ColoniaField';
import FormField from '@/components/FormField';
import ProtectedRoute from '@/components/ProtectedRoute';
import { alcaldiaOptions, getCodigoPostal, parseColoniaValue } from '@/data/cdmxCatalog';
import { formatDireccionFromFormValues } from '@/utils/formatAddress';
import { gradoEstudianteInicial, gradoEstudianteOptions } from '@/utils/paqueteGrados';
import { createPedidoSchema } from '@/validation/schemas';

const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="mb-4 flex h-[280px] items-center justify-center rounded-xl border-2 border-escolar-sky bg-escolar-chalk/40 text-sm text-gray-600">
      Cargando mapa...
    </div>
  ),
});

function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price);
}

function PedidoContent() {
  const params = useParams();
  const id = params.id;
  const [paquete, setPaquete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');

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
        <Link href="/paquetes" className="btn-primary mt-4 inline-flex w-full sm:w-auto">
          Volver a paquetes
        </Link>
      </div>
    );
  }

  const contenido = Array.isArray(paquete.contenido) ? paquete.contenido : [];
  const gradosPermitidos = paquete.grados_permitidos || [];
  const gradoOptions = gradoEstudianteOptions(gradosPermitidos);
  const gradoInicial = gradoEstudianteInicial(gradosPermitidos);
  const pedidoValidationSchema = createPedidoSchema(gradosPermitidos);

  return (
    <div className="container-app page-section">
      <Link
        href="/paquetes"
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

            <Formik
                key={paquete.id}
                initialValues={{
                  cantidad: 1,
                  nombre_estudiante: '',
                  grado_estudiante: gradoInicial,
                  escuela: '',
                  alcaldia: '',
                  colonia: '',
                  codigo_postal: '',
                  numero_exterior: '',
                  numero_interior: '',
                  calle: '',
                  lat: null,
                  lng: null,
                  notas: '',
                }}
                validationSchema={pedidoValidationSchema}
                onSubmit={async (values, { setSubmitting }) => {
                  setServerError('');
                  try {
                    const { colonia: coloniaNombre } = parseColoniaValue(values.colonia);
                    const { data } = await api.post('/pedidos', {
                      paquete_id: Number(paquete.id),
                      cantidad: Number(values.cantidad),
                      nombre_estudiante: values.nombre_estudiante,
                      grado_estudiante: values.grado_estudiante,
                      escuela: values.escuela,
                      alcaldia: values.alcaldia,
                      colonia: coloniaNombre,
                      codigo_postal: values.codigo_postal,
                      numero_exterior: values.numero_exterior,
                      numero_interior: values.numero_interior || null,
                      calle: values.calle,
                      lat: values.lat,
                      lng: values.lng,
                      notas: values.notas?.trim() || '',
                    });
                    if (!data.checkout_url) {
                      setServerError('No se pudo abrir la pasarela de Mercado Pago');
                      return;
                    }

                    const checkoutPage = `/pedido/pago/checkout?url=${encodeURIComponent(data.checkout_url)}`;
                    window.location.href = checkoutPage;
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
                {({ values, isSubmitting, setFieldValue, setFieldTouched, errors, touched }) => (
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
                        placeholder="Nombre del alumno"
                      />
                      <div className="mb-4">
                        <label htmlFor="grado_estudiante" className="label-field">
                          Grado del estudiante
                        </label>
                        <p className="mb-2 text-sm text-gray-600">
                          Paquete para <strong>{paquete.grado}</strong>
                          {gradosPermitidos.length > 1
                            ? ' — selecciona el grado específico del alumno'
                            : ''}
                        </p>
                        {gradosPermitidos.length === 1 ? (
                          <input
                            id="grado_estudiante"
                            name="grado_estudiante"
                            type="text"
                            readOnly
                            value={values.grado_estudiante}
                            className="input-field cursor-not-allowed bg-escolar-chalk/60"
                          />
                        ) : (
                          <FormField
                            label=""
                            name="grado_estudiante"
                            as="select"
                            options={gradoOptions}
                          />
                        )}
                        {touched.grado_estudiante && errors.grado_estudiante && (
                          <p className="error-text">{errors.grado_estudiante}</p>
                        )}
                      </div>
                      <FormField
                        label="Escuela"
                        name="escuela"
                        placeholder="Nombre de la escuela"
                      />

                      <div className="mb-2 mt-2 border-t border-escolar-sky pt-4">
                        <h3 className="mb-1 font-display text-base font-bold text-escolar-navy">
                          Dirección de entrega
                        </h3>
                        <p className="mb-4 text-sm text-gray-600">
                          Completa alcaldía, colonia, código postal, números exterior e interior,
                          calle y marca el punto exacto en el mapa.
                        </p>
                      </div>

                      <FormField
                        label="Alcaldía"
                        name="alcaldia"
                        as="select"
                        options={alcaldiaOptions()}
                        onChange={(value, form) => {
                          form.setFieldValue('colonia', '');
                          form.setFieldValue('codigo_postal', '');
                          form.setFieldValue('lat', null);
                          form.setFieldValue('lng', null);
                        }}
                      />
                      <ColoniaField
                        alcaldia={values.alcaldia}
                        onColoniaChange={(value, form) => {
                          const { colonia, cp } = parseColoniaValue(value);
                          form.setFieldValue(
                            'codigo_postal',
                            getCodigoPostal(form.values.alcaldia, colonia, cp)
                          );
                          form.setFieldTouched('codigo_postal', true, false);
                          form.setFieldValue('lat', null);
                          form.setFieldValue('lng', null);
                        }}
                      />
                      <div className="mb-4">
                        <label htmlFor="codigo_postal" className="label-field">
                          Código postal
                        </label>
                        <input
                          id="codigo_postal"
                          name="codigo_postal"
                          type="text"
                          readOnly
                          value={values.codigo_postal}
                          placeholder="Se asigna al elegir colonia"
                          className="input-field cursor-not-allowed bg-escolar-chalk/60"
                        />
                        {touched.codigo_postal && errors.codigo_postal && (
                          <p className="error-text">{errors.codigo_postal}</p>
                        )}
                      </div>
                      <FormField
                        label="Calle"
                        name="calle"
                        placeholder="Nombre de la calle"
                      />
                      <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
                        <FormField
                          label="Número exterior"
                          name="numero_exterior"
                          placeholder="Ej. 123"
                        />
                        <FormField
                          label="Número interior (opcional)"
                          name="numero_interior"
                          placeholder="Ej. 4B"
                        />
                      </div>

                      {formatDireccionFromFormValues(values) && (
                        <div className="mb-4 rounded-xl border border-escolar-navy/15 bg-escolar-sky/40 px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-escolar-navy">
                            Dirección que se guardará
                          </p>
                          <p className="mt-1 text-sm text-escolar-navy">
                            {formatDireccionFromFormValues(values)}
                          </p>
                        </div>
                      )}

                      <DeliveryMap
                        values={values}
                        setFieldValue={setFieldValue}
                        setFieldTouched={setFieldTouched}
                        errors={errors}
                        touched={touched}
                      />

                      <FormField
                        label="Instrucciones especiales de entrega (opcional)"
                        name="notas"
                        as="textarea"
                        rows={3}
                        placeholder="Ej. Tocar el timbre, entregar por la tarde, portón azul..."
                      />

                      <div className="mb-5 rounded-xl bg-escolar-sky/50 px-4 py-3 sm:mb-6">
                        <p className="text-sm text-gray-600">Total a pagar</p>
                        <p className="font-display text-xl font-bold text-escolar-navy sm:text-2xl">
                          {formatPrice(Number(paquete.precio) * (Number(values.cantidad) || 1))}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          Al confirmar serás redirigido a Mercado Pago. Puedes pagar con tarjeta o saldo
                          de Mercado Pago. Si eres el mismo titular de la cuenta que cobra, usa tarjeta
                          u otra cuenta de Mercado Libre (no puedes pagarte a ti mismo con tu saldo).
                        </p>
                      </div>

                      {serverError && (
                        <div className="mb-4 rounded-xl bg-escolar-coral/10 px-4 py-3 text-sm text-escolar-coral">
                          {serverError}
                        </div>
                      )}

                      <button type="submit" disabled={isSubmitting} className="btn-accent w-full">
                        {isSubmitting ? 'Redirigiendo al pago...' : 'Confirmar pedido y pagar'}
                      </button>
                    </Form>
                )}
              </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PedidoPage() {
  return (
    <ProtectedRoute>
      <PedidoContent />
    </ProtectedRoute>
  );
}
