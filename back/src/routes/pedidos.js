import { Router } from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateCodigoPedido } from '../utils/qrPedido.js';
import { esGradoPermitido } from '../utils/paqueteGrados.js';
import { buildDireccionEntrega } from '../utils/formatAddress.js';
import {
  createCheckoutPreference,
  isPaymentEnabled,
  MP_MIN_CARD_AMOUNT_MXN,
} from '../services/mercadopago.js';

const router = Router();

const PEDIDO_SELECT = `
  p.id, p.cantidad, p.nombre_estudiante, p.grado_estudiante, p.escuela,
  p.direccion_entrega, p.alcaldia, p.colonia, p.calle,
  p.numero_exterior, p.numero_interior, p.codigo_postal, p.lat, p.lng,
  p.notas, p.total, p.estado, p.codigo_qr, p.pago_estado, p.pagado_at,
  p.fecha_entrega_programada, p.notas_entrega, p.entregado_at, p.created_at
`;

router.get('/consulta/:codigo', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${PEDIDO_SELECT},
              pk.nombre AS paquete_nombre, pk.grado AS paquete_grado,
              pk.descripcion AS paquete_descripcion, pk.contenido AS paquete_contenido,
              pk.precio AS paquete_precio,
              u.nombre AS cliente_nombre, u.apellido AS cliente_apellido,
              u.email AS cliente_email, u.telefono AS cliente_telefono
       FROM pedidos p
       JOIN paquetes pk ON pk.id = p.paquete_id
       JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.codigo_qr = $1`,
      [req.params.codigo]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al consultar pedido:', error);
    res.status(500).json({ message: 'Error al consultar pedido' });
  }
});

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${PEDIDO_SELECT},
              pk.nombre AS paquete_nombre, pk.grado AS paquete_grado
       FROM pedidos p
       JOIN paquetes pk ON pk.id = p.paquete_id
       WHERE p.usuario_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ message: 'Error al obtener pedidos' });
  }
});

router.post('/', async (req, res) => {
  const {
    paquete_id,
    cantidad,
    nombre_estudiante,
    grado_estudiante,
    escuela,
    alcaldia,
    colonia,
    calle,
    numero_exterior,
    numero_interior,
    codigo_postal,
    lat,
    lng,
    notas,
  } = req.body;

  const direccion_entrega = buildDireccionEntrega(req.body);

  if (
    !paquete_id ||
    !nombre_estudiante ||
    !grado_estudiante ||
    !escuela ||
    !alcaldia ||
    !colonia ||
    !codigo_postal ||
    !calle ||
    !numero_exterior ||
    !direccion_entrega ||
    lat == null ||
    lng == null
  ) {
    return res.status(400).json({ message: 'Faltan campos obligatorios del pedido' });
  }

  if (!isPaymentEnabled()) {
    return res.status(503).json({
      message:
        'Mercado Pago no está configurado. Agrega MP_ACCESS_TOKEN (credencial de prueba TEST-...) en back/.env y reinicia el servidor.',
    });
  }

  const qty = Number(cantidad) || 1;

  if (qty < 1 || qty > 10) {
    return res.status(400).json({ message: 'La cantidad debe ser entre 1 y 10' });
  }

  try {
    const paqueteResult = await pool.query(
      'SELECT id, nombre, precio, grado FROM paquetes WHERE id = $1 AND activo = TRUE',
      [paquete_id]
    );

    if (paqueteResult.rowCount === 0) {
      return res.status(404).json({ message: 'Paquete no encontrado' });
    }

    const paquete = paqueteResult.rows[0];

    if (!esGradoPermitido(paquete.grado, grado_estudiante)) {
      return res.status(400).json({
        message: 'El grado del estudiante no corresponde al paquete seleccionado',
      });
    }

    const precio = Number(paquete.precio);
    const total = precio * qty;
    const notasEntrega = notas?.trim() ? notas.trim() : null;

    if (total < MP_MIN_CARD_AMOUNT_MXN) {
      return res.status(400).json({
        message: `El monto mínimo para pagar con tarjeta en Mercado Pago es $${MP_MIN_CARD_AMOUNT_MXN} MXN. Este pedido sería de $${total.toFixed(2)}.`,
      });
    }

    const codigo_qr = generateCodigoPedido();

    const result = await pool.query(
      `INSERT INTO pedidos
        (usuario_id, paquete_id, cantidad, nombre_estudiante, grado_estudiante,
         escuela, direccion_entrega, alcaldia, colonia, calle,
         numero_exterior, numero_interior, codigo_postal, lat, lng, notas, total,
         codigo_qr, estado, pago_estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        req.user.id,
        paquete_id,
        qty,
        nombre_estudiante.trim(),
        grado_estudiante.trim(),
        escuela.trim(),
        direccion_entrega,
        alcaldia.trim(),
        colonia.trim(),
        calle.trim(),
        numero_exterior.trim(),
        numero_interior?.trim() || null,
        codigo_postal.trim(),
        Number(lat),
        Number(lng),
        notasEntrega,
        total,
        codigo_qr,
        'pendiente_pago',
        'pending',
      ]
    );

    const pedido = result.rows[0];

    const { preferenceId, checkoutUrl } = await createCheckoutPreference({
      pedidoId: pedido.id,
      paqueteNombre: paquete.nombre,
      cantidad: qty,
      unitPrice: precio,
      payerEmail: req.user.email,
    });

    await pool.query(`UPDATE pedidos SET mp_preference_id = $1 WHERE id = $2`, [
      preferenceId,
      pedido.id,
    ]);

    res.status(201).json({
      ...pedido,
      mp_preference_id: preferenceId,
      checkout_url: checkoutUrl,
      paquete_nombre: paquete.nombre,
      paquete_grado: paquete.grado,
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);

    if (error.message === 'MP_AMOUNT_TOO_LOW') {
      return res.status(400).json({
        message: `El monto mínimo para pagar con tarjeta en Mercado Pago es $${MP_MIN_CARD_AMOUNT_MXN} MXN.`,
      });
    }

    if (error.message === 'MP_NOT_CONFIGURED') {
      return res.status(503).json({
        message:
          'La pasarela de pagos no está configurada. Contacta al administrador (MP_ACCESS_TOKEN).',
      });
    }

    if (error.message === 'MP_CHECKOUT_URL_MISSING') {
      return res.status(502).json({ message: 'No se pudo generar la pasarela de pago' });
    }

    if (error.code === '23505') {
      return res.status(409).json({ message: 'Código de pedido duplicado, intenta de nuevo' });
    }

    if (error.code === '42703') {
      return res.status(500).json({ message: 'Base de datos desactualizada. Reinicia el servidor backend.' });
    }

    const mpMessage = error?.message || error?.cause?.[0]?.description;
    if (mpMessage && mpMessage !== 'MP_NOT_CONFIGURED' && mpMessage !== 'MP_CHECKOUT_URL_MISSING') {
      return res.status(502).json({ message: `Mercado Pago: ${mpMessage}` });
    }

    res.status(500).json({ message: 'Error al crear pedido' });
  }
});

export default router;
