import { MercadoPagoConfig, Payment, Preference, User } from 'mercadopago';

let cachedAccountInfo = null;

export function getAccessToken() {
  return (process.env.MP_ACCESS_TOKEN_PROD || process.env.MP_ACCESS_TOKEN || '').trim();
}

export function getCredentialMode() {
  const token = getAccessToken();
  if (token.startsWith('TEST-')) return 'test';
  if (token.startsWith('APP_USR-')) return 'app_usr';
  return 'unknown';
}

export function isMockPaymentMode() {
  return process.env.MP_PAYMENT_MODE === 'mock';
}

export function isMercadoPagoConfigured() {
  const token = getAccessToken();
  if (!token) return false;
  if (token.includes('tu_token') || token === 'TEST-') return false;
  return token.length >= 20;
}

export function isPaymentEnabled() {
  if (isMockPaymentMode()) return true;
  return isMercadoPagoConfigured();
}

/** Monto mínimo en MXN para tarjetas Visa/Mastercard en Mercado Pago México. */
export const MP_MIN_CARD_AMOUNT_MXN = 5;

export function isTestSellerAccount(account) {
  return account?.tags?.includes('test_user') ?? false;
}

export async function getAccountInfo() {
  const token = getAccessToken();
  if (cachedAccountInfo?.token === token) return cachedAccountInfo.account;

  const client = getClient();
  const userClient = new User(client);
  const account = await userClient.get();
  cachedAccountInfo = { token, account };
  return account;
}

export async function getSellerMode() {
  if (isMockPaymentMode()) return 'mock';
  if (process.env.MP_SANDBOX === 'true') return 'test';

  if (isMercadoPagoConfigured()) {
    try {
      const account = await getAccountInfo();
      if (isTestSellerAccount(account)) return 'test';
      return 'production';
    } catch {
      // Si MP no responde, usar credencial y MP_SANDBOX como respaldo.
    }
  }

  if (process.env.MP_SANDBOX === 'false') return 'production';
  if (getCredentialMode() === 'test') return 'test';
  return 'unknown';
}

function getClient() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('MP_NOT_CONFIGURED');
  }

  return new MercadoPagoConfig({ accessToken });
}

export async function createCheckoutPreference({
  pedidoId,
  paqueteNombre,
  cantidad,
  unitPrice,
  payerEmail,
}) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  if (isMockPaymentMode()) {
    const mockPaymentId = `mock-${pedidoId}`;
    return {
      preferenceId: mockPaymentId,
      checkoutUrl: `${clientUrl}/pedido/pago/exito?pedido_id=${pedidoId}&payment_id=${mockPaymentId}&status=approved`,
    };
  }

  const client = getClient();
  const preferenceClient = new Preference(client);
  const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
  const price = Number(Number(unitPrice).toFixed(2));
  if (!isMockPaymentMode() && price < MP_MIN_CARD_AMOUNT_MXN) {
    throw new Error('MP_AMOUNT_TOO_LOW');
  }
  const isLocalhost =
    clientUrl.includes('localhost') ||
    clientUrl.includes('127.0.0.1') ||
    apiUrl.includes('localhost') ||
    apiUrl.includes('127.0.0.1');

  const preferenceBody = {
    items: [
      {
        id: String(pedidoId),
        title: paqueteNombre,
        description: `Pedido #${pedidoId} — Útiles Escolares`,
        quantity: Number(cantidad),
        unit_price: price,
        currency_id: 'MXN',
      },
    ],
    back_urls: {
      success: `${clientUrl}/pedido/pago/exito?pedido_id=${pedidoId}`,
      failure: `${clientUrl}/pedido/pago/error?pedido_id=${pedidoId}`,
      pending: `${clientUrl}/pedido/pago/pendiente?pedido_id=${pedidoId}`,
    },
    external_reference: String(pedidoId),
    statement_descriptor: 'UTILES ESCOLARES',
  };

  // payerEmail se recibe por compatibilidad pero no se envía a MP (evita bloqueos por auto-pago).

  if (!isLocalhost) {
    preferenceBody.auto_return = 'approved';
    preferenceBody.notification_url = `${apiUrl}/api/pagos/webhook`;
  }

  const result = await preferenceClient.create({
    body: preferenceBody,
  });

  const sellerMode = await getSellerMode();
  const useSandboxCheckout = sellerMode === 'test';

  const checkoutUrl = useSandboxCheckout
    ? result.sandbox_init_point || result.init_point
    : result.init_point || result.sandbox_init_point;

  if (!checkoutUrl) {
    throw new Error('MP_CHECKOUT_URL_MISSING');
  }

  return {
    preferenceId: result.id,
    checkoutUrl,
    sellerMode,
  };
}

export async function fetchPayment(paymentId) {
  const client = getClient();
  const paymentClient = new Payment(client);
  return paymentClient.get({ id: paymentId });
}

export async function searchPaymentsByReference(externalReference) {
  if (isMockPaymentMode() || !isMercadoPagoConfigured()) return [];

  const token = getAccessToken();
  const url = new URL('https://api.mercadopago.com/v1/payments/search');
  url.searchParams.set('sort', 'date_created');
  url.searchParams.set('criteria', 'desc');
  url.searchParams.set('external_reference', String(externalReference));

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`MP_SEARCH_FAILED_${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

export function mapPaymentStatus(mpStatus) {
  switch (mpStatus) {
    case 'approved':
      return 'approved';
    case 'rejected':
    case 'cancelled':
      return 'rejected';
    case 'in_process':
    case 'pending':
    case 'in_mediation':
      return 'pending';
    default:
      return 'pending';
  }
}

export function mapPedidoEstado(pagoEstado) {
  if (pagoEstado === 'approved') return 'confirmado';
  if (pagoEstado === 'rejected') return 'pago_rechazado';
  return 'pendiente_pago';
}
