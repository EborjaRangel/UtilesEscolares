import { Router } from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  createCheckoutPreference,
  fetchPayment,
  getSellerMode,
  isMercadoPagoConfigured,
  isMockPaymentMode,
  isPaymentEnabled,
  mapPaymentStatus,
  mapPedidoEstado,
  MP_MIN_CARD_AMOUNT_MXN,
  searchPaymentsByReference,
} from '../services/mercadopago.js';

const router = Router();

router.get('/config', async (_req, res) => {
  const sellerMode = isMockPaymentMode() ? 'mock' : await getSellerMode();

  res.json({
    provider: 'mercadopago',
    mode: sellerMode,
    enabled: isPaymentEnabled(),
    testMode: sellerMode === 'test' || sellerMode === 'mock',
    hint:
      sellerMode === 'production'
        ? `Mercado Pago exige mínimo $${MP_MIN_CARD_AMOUNT_MXN} MXN para pagar con Visa/Mastercard. Usa incógnito, paga sin cuenta del vendedor y escribe la tarjeta sin espacios.`
        : sellerMode === 'test'
          ? 'Modo prueba de Mercado Pago.'
          : null,
  });
});

const PEDIDO_SELECT = `
  p.id, p.cantidad, p.nombre_estudiante, p.grado_estudiante, p.escuela,
  p.direccion_entrega, p.alcaldia, p.colonia, p.calle,
  p.numero_exterior, p.numero_interior, p.codigo_postal, p.lat, p.lng,
  p.notas, p.total, p.estado, p.codigo_qr, p.pago_estado, p.mp_payment_id,
  p.fecha_entrega_programada, p.notas_entrega, p.pagado_at, p.created_at
`;

const PAYMENT_STATUS_PRIORITY = {
  approved: 3,
  authorized: 2,
  in_process: 1,
  pending: 1,
  in_mediation: 1,
  rejected: 0,
  cancelled: 0,
};

async function syncPedidoFromMercadoPago(pedidoId) {
  if (!isMercadoPagoConfigured()) return null;

  const payments = await searchPaymentsByReference(pedidoId);
  if (payments.length === 0) return null;

  const bestPayment = [...payments].sort(
    (a, b) => (PAYMENT_STATUS_PRIORITY[b.status] ?? -1) - (PAYMENT_STATUS_PRIORITY[a.status] ?? -1)
  )[0];

  return updatePedidoPago(pedidoId, bestPayment.id, bestPayment.status);
}

async function updatePedidoPago(pedidoId, paymentId, mpStatus) {
  const pagoEstado = mapPaymentStatus(mpStatus);
  const estado = mapPedidoEstado(pagoEstado);

  const result = await pool.query(
    `UPDATE pedidos
     SET pago_estado = $1,
         estado = $2,
         mp_payment_id = COALESCE($3, mp_payment_id),
         pagado_at = CASE
           WHEN $1 = 'approved' THEN COALESCE(pagado_at, CURRENT_TIMESTAMP)
           ELSE pagado_at
         END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [pagoEstado, estado, paymentId ? String(paymentId) : null, pedidoId]
  );

  return result.rows[0] || null;
}

router.post('/checkout/:pedidoId', authMiddleware, async (req, res) => {
  if (!isPaymentEnabled()) {
    return res.status(503).json({ message: 'Pasarela de pagos no configurada' });
  }

  const pedidoId = Number(req.params.pedidoId);

  try {
    const result = await pool.query(
      `SELECT p.id, p.cantidad, p.total, p.estado, p.pago_estado,
              pk.nombre AS paquete_nombre, pk.precio AS paquete_precio
       FROM pedidos p
       JOIN paquetes pk ON pk.id = p.paquete_id
       WHERE p.id = $1 AND p.usuario_id = $2`,
      [pedidoId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedido = result.rows[0];

    if (pedido.pago_estado === 'approved') {
      return res.status(400).json({ message: 'Este pedido ya fue pagado' });
    }

    if (Number(pedido.total) < MP_MIN_CARD_AMOUNT_MXN) {
      return res.status(400).json({
        message: `Este pedido es de $${Number(pedido.total).toFixed(2)}. Mercado Pago no acepta tarjetas Visa/Mastercard por debajo de $${MP_MIN_CARD_AMOUNT_MXN} MXN. Crea un pedido nuevo con un paquete de $${MP_MIN_CARD_AMOUNT_MXN} o más.`,
      });
    }

    const { preferenceId, checkoutUrl } = await createCheckoutPreference({
      pedidoId: pedido.id,
      paqueteNombre: pedido.paquete_nombre,
      cantidad: pedido.cantidad,
      unitPrice: pedido.paquete_precio,
      payerEmail: req.user.email,
    });

    await pool.query(`UPDATE pedidos SET mp_preference_id = $1 WHERE id = $2`, [
      preferenceId,
      pedido.id,
    ]);

    res.json({ checkout_url: checkoutUrl });
  } catch (error) {
    console.error('Error al reabrir checkout:', error);

    if (error.message === 'MP_AMOUNT_TOO_LOW') {
      return res.status(400).json({
        message: `Mercado Pago no acepta tarjetas Visa/Mastercard por debajo de $${MP_MIN_CARD_AMOUNT_MXN} MXN.`,
      });
    }

    res.status(500).json({ message: 'No se pudo abrir la pasarela de pago' });
  }
});

router.post('/webhook', async (req, res) => {
  if (!isMercadoPagoConfigured()) {
    return res.status(503).json({ message: 'Pasarela de pagos no configurada' });
  }

  try {
    const { type, data } = req.body;

    if (type !== 'payment' || !data?.id) {
      return res.status(200).send('OK');
    }

    const payment = await fetchPayment(data.id);
    const pedidoId = Number(payment.external_reference);

    if (!pedidoId) {
      return res.status(200).send('OK');
    }

    await updatePedidoPago(pedidoId, payment.id, payment.status);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook de pago:', error);
    res.status(500).json({ message: 'Error al procesar webhook' });
  }
});

router.post('/sincronizar', authMiddleware, async (req, res) => {
  if (!isPaymentEnabled()) {
    return res.status(503).json({ message: 'Pasarela de pagos no configurada' });
  }

  try {
    const pending = await pool.query(
      `SELECT id FROM pedidos
       WHERE usuario_id = $1 AND pago_estado IS DISTINCT FROM 'approved'
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );

    let synced = 0;

    for (const row of pending.rows) {
      const updated = await syncPedidoFromMercadoPago(row.id);
      if (updated?.pago_estado === 'approved') synced += 1;
    }

    res.json({ synced });
  } catch (error) {
    console.error('Error al sincronizar pagos:', error);
    res.status(500).json({ message: 'No se pudieron sincronizar los pagos' });
  }
});

router.get('/verificar/:pedidoId', authMiddleware, async (req, res) => {
  if (!isPaymentEnabled()) {
    return res.status(503).json({ message: 'Pasarela de pagos no configurada' });
  }

  const pedidoId = Number(req.params.pedidoId);
  const paymentId = req.query.payment_id || req.query.collection_id;

  if (!pedidoId) {
    return res.status(400).json({ message: 'Pedido inválido' });
  }

  try {
    const pedidoResult = await pool.query(
      `SELECT ${PEDIDO_SELECT},
              pk.nombre AS paquete_nombre, pk.grado AS paquete_grado
       FROM pedidos p
       JOIN paquetes pk ON pk.id = p.paquete_id
       WHERE p.id = $1 AND p.usuario_id = $2`,
      [pedidoId, req.user.id]
    );

    if (pedidoResult.rowCount === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    let pedido = pedidoResult.rows[0];

    if (pedido.pago_estado === 'approved') {
      return res.json(pedido);
    }

    if (paymentId) {
      if (isMockPaymentMode() && String(paymentId).startsWith('mock-')) {
        const updated = await updatePedidoPago(pedidoId, paymentId, 'approved');
        if (updated) {
          pedido = { ...pedido, ...updated };
        }
      } else if (isMercadoPagoConfigured()) {
        const payment = await fetchPayment(paymentId);

        if (String(payment.external_reference) !== String(pedidoId)) {
          return res.status(400).json({ message: 'El pago no corresponde a este pedido' });
        }

        const updated = await updatePedidoPago(pedidoId, payment.id, payment.status);

        if (updated) {
          pedido = {
            ...pedido,
            ...updated,
          };
        }
      }
    } else if (pedido.pago_estado !== 'approved') {
      const updated = await syncPedidoFromMercadoPago(pedidoId);
      if (updated) {
        pedido = { ...pedido, ...updated };
      }
    }

    res.json(pedido);
  } catch (error) {
    console.error('Error al verificar pago:', error);
    res.status(500).json({ message: 'Error al verificar el pago' });
  }
});

export default router;
