import { MercadoPagoConfig, Payment, Preference, User } from 'mercadopago';

let cachedAccountInfo = null;

export function getCredentialMode() {
  const token = process.env.MP_ACCESS_TOKEN?.trim() || '';
  if (token.startsWith('TEST-')) return 'test';
  // Producción: APP_USR-{userId}-{fecha MMDDYY}-...
  if (/^APP_USR-\d+-\d{6}-/.test(token)) return 'production';
  // Prueba: APP_USR-{uuid}-{uuid}-...
  if (token.startsWith('APP_USR-')) return 'test';
  return 'unknown';
}

export function isMockPaymentMode() {
  return process.env.MP_PAYMENT_MODE === 'mock';
}

export function isMercadoPagoConfigured() {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
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
  if (cachedAccountInfo) return cachedAccountInfo;
  const client = getClient();
  const userClient = new User(client);
  cachedAccountInfo = await userClient.get();
  return cachedAccountInfo;
}

export async function getSellerMode() {
  if (process.env.MP_SANDBOX === 'true') return 'test';
  if (process.env.MP_SANDBOX === 'false') return 'production';

  const credentialMode = getCredentialMode();
  if (credentialMode === 'test' || credentialMode === 'production') {
    return credentialMode;
  }

  try {
    const account = await getAccountInfo();
    return isTestSellerAccount(account) ? 'test' : 'production';
  } catch {
    return 'unknown';
  }
}

function getClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN?.trim();

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

  const token = process.env.MP_ACCESS_TOKEN?.trim();
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
