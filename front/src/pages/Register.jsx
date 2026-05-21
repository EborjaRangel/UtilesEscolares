import { Form, Formik } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { registerSchema } from '../validation/schemas';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  return (
    <div className="container-app py-8 sm:py-12">
      <div className="card mx-auto w-full max-w-lg">
        <div className="mb-5 text-center sm:mb-6">
          <span className="mb-2 inline-block text-3xl sm:mb-3 sm:text-4xl">✏️</span>
          <h1 className="font-display text-xl font-bold text-escolar-navy sm:text-2xl">
            Crear cuenta
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Regístrate para pedir paquetes de útiles escolares
          </p>
        </div>

        <Formik
          initialValues={{
            nombre: '',
            apellido: '',
            email: '',
            telefono: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={registerSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setServerError('');
            try {
              const { confirmPassword, ...data } = values;
              await register(data);
              navigate('/paquetes');
            } catch (err) {
              setServerError(err.response?.data?.message || 'Error al registrarse');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
                <FormField label="Nombre" name="nombre" placeholder="María" />
                <FormField label="Apellido" name="apellido" placeholder="García" />
              </div>
              <FormField
                label="Correo electrónico"
                name="email"
                type="email"
                placeholder="tu@correo.com"
              />
              <FormField
                label="Teléfono (opcional)"
                name="telefono"
                type="tel"
                placeholder="55 1234 5678"
              />
              <FormField
                label="Contraseña"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
              />
              <FormField
                label="Confirmar contraseña"
                name="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
              />

              {serverError && (
                <div className="mb-4 rounded-xl bg-escolar-coral/10 px-4 py-3 text-sm text-escolar-coral">
                  {serverError}
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="btn-accent w-full">
                {isSubmitting ? 'Creando cuenta...' : 'Registrarme'}
              </button>
            </Form>
          )}
        </Formik>

        <p className="mt-5 text-center text-sm text-gray-600 sm:mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-escolar-blue hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
