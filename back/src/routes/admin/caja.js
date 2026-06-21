import { Router } from 'express';
import pool from '../../config/db.js';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js';
import { syncPedidoFromMercadoPago } from '../../services/pedidoPago.js';
import { ENTREGA_MAX_HORAS, validarFechaEntrega } from '../../utils/entrega.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

const PEDIDO_ADMIN_SELECT = `
  p.id, p.cantidad, p.nombre_estudiante, p.grado_estudiante, p.escuela,
  p.direccion_entrega, p.alcaldia, p.colonia, p.calle,
  p.numero_exterior, p.numero_interior, p.codigo_postal, p.lat, p.lng,
  p.notas, p.total, p.estado, p.codigo_qr, p.pago_estado, p.mp_payment_id,
  p.fecha_entrega_programada, p.notas_entrega, p.created_at, p.updated_at, p.pagado_at,
  pk.nombre AS paquete_nombre, pk.grado AS paquete_grado,
  u.nombre AS cliente_nombre, u.apellido AS cliente_apellido,
  u.email AS cliente_email, u.telefono AS cliente_telefono
`;

const QR_CONDITION = `p.codigo_qr IS NOT NULL AND TRIM(p.codigo_qr) <> ''`;

/** Solo pedidos pagados en Mercado Pago y con código QR generado. */
const CAJA_PEDIDO_CONDITION = `p.pago_estado = 'approved' AND ${QR_CONDITION}`;

function filtroSql(filtro) {
  switch (filtro) {
    case 'por_entregar':
      return `${CAJA_PEDIDO_CONDITION} AND p.estado = 'confirmado' AND p.fecha_entrega_programada IS NULL`;
    case 'programados':
      return `${CAJA_PEDIDO_CONDITION} AND p.estado = 'confirmado' AND p.fecha_entrega_programada IS NOT NULL`;
    case 'enviados':
      return `${CAJA_PEDIDO_CONDITION} AND p.estado = 'enviado'`;
    case 'vencidos':
      return `${CAJA_PEDIDO_CONDITION} AND p.estado <> 'entregado' AND p.pagado_at IS NOT NULL AND p.pagado_at + INTERVAL '${ENTREGA_MAX_HORAS} hours' < NOW()`;
    case 'entregados':
      return `${CAJA_PEDIDO_CONDITION} AND p.estado = 'entregado'`;
    default:
      return CAJA_PEDIDO_CONDITION;
  }
}

router.post('/sincronizar', async (_req, res) => {
  try {
    const pending = await pool.query(
      `SELECT id FROM pedidos
       WHERE pago_estado IS DISTINCT FROM 'approved'
       ORDER BY created_at DESC
       LIMIT 50`
    );

    let synced = 0;
    for (const row of pending.rows) {
      const updated = await syncPedidoFromMercadoPago(row.id);
      if (updated) synced += 1;
    }

    res.json({ synced });
  } catch (error) {
    console.error('Error al sincronizar pagos (admin):', error);
    res.status(500).json({ message: 'No se pudieron sincronizar los pagos' });
  }
});

router.get('/resumen', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE ${CAJA_PEDIDO_CONDITION})::int AS pagados,
        COALESCE(SUM(p.total) FILTER (WHERE ${CAJA_PEDIDO_CONDITION}), 0) AS ingresos,
        COUNT(*) FILTER (WHERE ${CAJA_PEDIDO_CONDITION} AND p.estado = 'confirmado' AND p.fecha_entrega_programada IS NULL)::int AS por_programar,
        COUNT(*) FILTER (WHERE ${CAJA_PEDIDO_CONDITION} AND p.estado = 'confirmado' AND p.fecha_entrega_programada IS NOT NULL)::int AS programados,
        COUNT(*) FILTER (WHERE ${CAJA_PEDIDO_CONDITION} AND p.estado = 'enviado')::int AS enviados,
        COUNT(*) FILTER (WHERE ${CAJA_PEDIDO_CONDITION} AND p.estado = 'entregado')::int AS entregados,
        COUNT(*) FILTER (
          WHERE ${CAJA_PEDIDO_CONDITION}
            AND p.estado <> 'entregado'
            AND p.pagado_at IS NOT NULL
            AND p.pagado_at + INTERVAL '${ENTREGA_MAX_HORAS} hours' < NOW()
        )::int AS vencidos
      FROM pedidos p
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener resumen de caja:', error);
    res.status(500).json({ message: 'Error al obtener resumen de caja' });
  }
});

router.get('/pedidos', async (req, res) => {
  const filtro = req.query.filtro || 'todos';

  try {
    const where = filtroSql(filtro);
    const result = await pool.query(
      `SELECT ${PEDIDO_ADMIN_SELECT}
       FROM pedidos p
       JOIN paquetes pk ON pk.id = p.paquete_id
       JOIN usuarios u ON u.id = p.usuario_id
       WHERE ${where}
       ORDER BY
         CASE WHEN p.fecha_entrega_programada IS NOT NULL THEN 0 ELSE 1 END,
         p.fecha_entrega_programada ASC NULLS LAST,
         p.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar pedidos de caja:', error);
    res.status(500).json({ message: 'Error al listar pedidos' });
  }
});

router.patch('/pedidos/:id/programar', async (req, res) => {
  const pedidoId = Number(req.params.id);
  const { fecha_entrega_programada, notas_entrega } = req.body;

  if (!fecha_entrega_programada) {
    return res.status(400).json({ message: 'La fecha de entrega es obligatoria' });
  }

  const fecha = new Date(fecha_entrega_programada);
  if (Number.isNaN(fecha.getTime())) {
    return res.status(400).json({ message: 'Fecha de entrega inválida' });
  }

  try {
    const existing = await pool.query(
      `SELECT id, pago_estado, estado, pagado_at, codigo_qr FROM pedidos WHERE id = $1`,
      [pedidoId]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedido = existing.rows[0];
    if (pedido.pago_estado !== 'approved' || !pedido.codigo_qr?.trim()) {
      return res.status(400).json({ message: 'Solo se pueden programar pedidos pagados con QR generado' });
    }

    if (!['confirmado', 'enviado'].includes(pedido.estado)) {
      return res.status(400).json({ message: 'Este pedido ya no puede programarse' });
    }

    const validacion = validarFechaEntrega(pedido.pagado_at, fecha);
    if (!validacion.ok) {
      return res.status(400).json({ message: validacion.message });
    }

    const result = await pool.query(
      `UPDATE pedidos
       SET fecha_entrega_programada = $1,
           notas_entrega = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id`,
      [fecha.toISOString(), notas_entrega?.trim() || null, pedidoId]
    );

    const updated = await pool.query(
      `SELECT ${PEDIDO_ADMIN_SELECT}
       FROM pedidos p
       JOIN paquetes pk ON pk.id = p.paquete_id
       JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.id = $1`,
      [result.rows[0].id]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error al programar entrega:', error);
    res.status(500).json({ message: 'Error al programar entrega' });
  }
});

router.patch('/pedidos/:id/estado', async (req, res) => {
  const pedidoId = Number(req.params.id);
  const { estado } = req.body;

  const allowed = ['confirmado', 'enviado', 'entregado'];
  if (!allowed.includes(estado)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }

  try {
    const existing = await pool.query(
      `SELECT id, pago_estado, estado, codigo_qr FROM pedidos WHERE id = $1`,
      [pedidoId]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedido = existing.rows[0];
    if (pedido.pago_estado !== 'approved' || !pedido.codigo_qr?.trim()) {
      return res.status(400).json({ message: 'Solo se pueden actualizar pedidos pagados con QR generado' });
    }

    const transitions = {
      confirmado: ['enviado'],
      enviado: ['entregado', 'confirmado'],
      entregado: ['confirmado'],
    };

    if (!transitions[pedido.estado]?.includes(estado)) {
      return res.status(400).json({
        message: `No se puede cambiar de "${pedido.estado}" a "${estado}"`,
      });
    }

    if (estado === 'enviado' && pedido.estado === 'confirmado') {
      // ok
    }

    const result = await pool.query(
      `UPDATE pedidos
       SET estado = $1,
           entregado_at = CASE WHEN $1 = 'entregado' THEN CURRENT_TIMESTAMP ELSE NULL END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id`,
      [estado, pedidoId]
    );

    const updated = await pool.query(
      `SELECT ${PEDIDO_ADMIN_SELECT}
       FROM pedidos p
       JOIN paquetes pk ON pk.id = p.paquete_id
       JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.id = $1`,
      [result.rows[0].id]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado del pedido' });
  }
});

export default router;
