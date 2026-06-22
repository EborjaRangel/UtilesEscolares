import pool from '../config/db.js';
import {
  isMercadoPagoConfigured,
  mapPaymentStatus,
  mapPedidoEstado,
  searchPaymentsByReference,
} from './mercadopago.js';

const PAYMENT_STATUS_PRIORITY = {
  approved: 3,
  authorized: 2,
  in_process: 1,
  pending: 1,
  in_mediation: 1,
  rejected: 0,
  cancelled: 0,
};

export async function registrarHistorialPago({
  pedidoId,
  mpPaymentId,
  mpStatus,
  monto,
  metodoPago,
  detalle,
}) {
  if (!mpPaymentId) return;

  const pagoEstado = mapPaymentStatus(mpStatus);

  await pool.query(
    `INSERT INTO pagos (pedido_id, mp_payment_id, estado_mp, pago_estado, monto, metodo_pago, detalle)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (mp_payment_id) DO UPDATE SET
       estado_mp = EXCLUDED.estado_mp,
       pago_estado = EXCLUDED.pago_estado,
       monto = EXCLUDED.monto,
       metodo_pago = EXCLUDED.metodo_pago,
       detalle = EXCLUDED.detalle,
       updated_at = CURRENT_TIMESTAMP`,
    [
      pedidoId,
      String(mpPaymentId),
      mpStatus,
      pagoEstado,
      monto ?? null,
      metodoPago ?? null,
      detalle ?? null,
    ]
  );
}

export async function updatePedidoPago(pedidoId, paymentId, mpStatus, paymentDetails = {}) {
  const pagoEstado = mapPaymentStatus(mpStatus);
  const estado = mapPedidoEstado(pagoEstado);

  const result = await pool.query(
    `UPDATE pedidos
     SET pago_estado = $1::varchar,
         estado = $2::varchar,
         mp_payment_id = COALESCE($3::varchar, mp_payment_id),
         pagado_at = CASE
           WHEN $1::varchar = 'approved' THEN COALESCE(pagado_at, CURRENT_TIMESTAMP)
           ELSE pagado_at
         END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [pagoEstado, estado, paymentId ? String(paymentId) : null, pedidoId]
  );

  if (result.rowCount > 0) {
    await registrarHistorialPago({
      pedidoId,
      mpPaymentId: paymentId,
      mpStatus,
      monto: paymentDetails.transaction_amount ?? paymentDetails.monto,
      metodoPago: paymentDetails.payment_method_id ?? paymentDetails.metodoPago,
      detalle: paymentDetails.status_detail ?? paymentDetails.detalle,
    });
  }

  return result.rows[0] || null;
}

export async function syncPedidoFromMercadoPago(pedidoId) {
  if (!isMercadoPagoConfigured()) return null;

  const payments = await searchPaymentsByReference(pedidoId);
  if (payments.length === 0) return null;

  const bestPayment = [...payments].sort(
    (a, b) => (PAYMENT_STATUS_PRIORITY[b.status] ?? -1) - (PAYMENT_STATUS_PRIORITY[a.status] ?? -1)
  )[0];

  return updatePedidoPago(pedidoId, bestPayment.id, bestPayment.status, bestPayment);
}
