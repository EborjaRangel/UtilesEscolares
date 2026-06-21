'use client';

import { Form, Formik } from 'formik';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import FormField from '@/components/FormField';
import { useAuth } from '@/context/AuthContext';
import { loginSchema } from '@/validation/schemas';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState('');

  return (
    <div className="container-app flex min-h-[60vh] items-center py-8 sm:min-h-[70vh] sm:py-12">
      <div className="card mx-auto w-full max-w-md">
        <div className="mb-5 text-center sm:mb-6">
          <span className="mb-2 inline-block text-3xl sm:mb-3 sm:text-4xl">🔐</span>
          <h1 className="font-display text-xl font-bold text-escolar-navy sm:text-2xl">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Accede para pedir y revisar tus paquetes escolares
          </p>
        </div>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setServerError('');
            try {
              const loggedInUser = await login(values);
              router.push(loggedInUser?.rol === 'admin' ? '/admin/caja' : '/paquetes');
            } catch (err) {
              setServerError(err.response?.data?.message || 'Error al iniciar sesión');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <FormField
                label="Correo electrónico"
                name="email"
                type="email"
                placeholder="tu@correo.com"
              />
              <FormField
                label="Contraseña"
                name="password"
                type="password"
                placeholder="••••••••"
              />

              {serverError && (
                <div className="mb-4 rounded-xl bg-escolar-coral/10 px-4 py-3 text-sm text-escolar-coral">
                  {serverError}
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </Form>
          )}
        </Formik>

        <p className="mt-5 text-center text-sm text-gray-600 sm:mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-semibold text-escolar-blue hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
