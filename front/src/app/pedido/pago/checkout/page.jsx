'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

function CheckoutRedirectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutUrl = searchParams.get('url');
  const [error, setError] = useState('');
  const [paymentHint, setPaymentHint] = useState('');

  const validCheckoutUrl = useMemo(() => {
    if (!checkoutUrl) return null;

    try {
      const parsed = new URL(checkoutUrl);
      const allowedHosts = ['mercadopago.com', 'mercadopago.com.mx', 'mpago.la'];
      const isMercadoPago = allowedHosts.some(
        (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      );

      return isMercadoPago ? checkoutUrl : null;
    } catch {
      return null;
    }
  }, [checkoutUrl]);

  useEffect(() => {
    fetch('/api/pagos/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.hint) setPaymentHint(data.hint);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!checkoutUrl) {
      setError('No se recibió la URL de pago de Mercado Pago.');
      return;
    }

    if (!validCheckoutUrl) {
      setError('La URL de pago no es válida.');
    }
  }, [checkoutUrl, validCheckoutUrl]);

  const goToMercadoPago = () => {
    if (validCheckoutUrl) {
      window.location.href = validCheckoutUrl;
    }
  };

  const copyLink = async () => {
    if (!validCheckoutUrl) return;
    try {
      await navigator.clipboard.writeText(validCheckoutUrl);
      alert('Enlace copiado. Pégalo en una ventana de incógnito (Ctrl+Shift+N).');
    } catch {
      prompt('Copia este enlace y ábrelo en incógnito:', validCheckoutUrl);
    }
  };

  if (error) {
    return (
      <div className="container-app flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-escolar-coral">{error}</p>
        <button type="button" onClick={() => router.push('/mis-pedidos')} className="btn-primary mt-4">
          Ver mis pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="container-app flex min-h-[50vh] flex-col items-center justify-center py-8">
      <div className="card max-w-lg text-left">
        <div className="mb-4 flex justify-center">
          <span className="rounded-xl bg-[#009EE3]/10 px-4 py-2 font-display text-lg font-bold text-[#009EE3]">
            Mercado Pago
          </span>
        </div>

        <h1 className="mb-3 text-center font-display text-xl font-bold text-escolar-navy">
          Antes de pagar, lee esto
        </h1>

        <div className="mb-5 space-y-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Si el botón &quot;Pagar&quot; aparece deshabilitado:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              El monto debe ser de al menos <strong>$5.00 MXN</strong> para Visa/Mastercard (Mercado
              Pago no acepta montos menores con esas tarjetas).
            </li>
            <li>
              Abre una <strong>ventana de incógnito</strong> (Ctrl+Shift+N) o cierra sesión en{' '}
              <a
                href="https://www.mercadopago.com.mx"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                mercadopago.com
              </a>
              .
            </li>
            <li>
              En el checkout elige <strong>&quot;Pagar sin cuenta&quot;</strong> o inicia sesión con
              otra cuenta distinta al vendedor.
            </li>
            <li>
              Paga con <strong>tarjeta de crédito/débito</strong> que no esté ligada a la cuenta que
              cobra.
            </li>
            <li>
              Escribe el número de tarjeta <strong>sin espacios</strong>, revisa tipo (Visa/Mastercard)
              y que CVV y vencimiento sean correctos.
            </li>
          </ol>
        </div>

        {paymentHint && (
          <p className="mb-5 rounded-lg bg-escolar-sky/50 px-3 py-2 text-xs text-escolar-navy">
            {paymentHint}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={goToMercadoPago} className="btn-primary flex-1">
            Continuar a Mercado Pago
          </button>
          <button type="button" onClick={copyLink} className="btn-secondary flex-1">
            Copiar enlace para incógnito
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.push('/mis-pedidos')}
          className="mt-4 w-full text-center text-sm text-gray-500 hover:text-escolar-navy"
        >
          Volver a mis pedidos
        </button>
      </div>
    </div>
  );
}

export default function CheckoutRedirectPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-escolar-sky border-t-escolar-navy" />
          </div>
        }
      >
        <CheckoutRedirectContent />
      </Suspense>
    </ProtectedRoute>
  );
}
