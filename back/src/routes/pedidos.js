import { Router } from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateCodigoPedido } from '../utils/qrPedido.js';

const router = Router();

router.get('/consulta/:codigo', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.cantidad, p.nombre_estudiante, p.grado_estudiante, p.escuela,
              p.direccion_entrega, p.notas, p.total, p.estado, p.codigo_qr, p.created_at,
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
      `SELECT p.id, p.cantidad, p.nombre_estudiante, p.grado_estudiante, p.escuela,
              p.direccion_entrega, p.notas, p.total, p.estado, p.codigo_qr, p.created_at,
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
    direccion_entrega,
    notas,
  } = req.body;

  if (!paquete_id || !nombre_estudiante || !grado_estudiante || !escuela || !direccion_entrega) {
    return res.status(400).json({ message: 'Faltan campos obligatorios del pedido' });
  }

  const qty = Number(cantidad) || 1;

  if (qty < 1 || qty > 10) {
    return res.status(400).json({ message: 'La cantidad debe ser entre 1 y 10' });
  }

  try {
    const paqueteResult = await pool.query(
      'SELECT id, precio FROM paquetes WHERE id = $1 AND activo = TRUE',
      [paquete_id]
    );

    if (paqueteResult.rowCount === 0) {
      return res.status(404).json({ message: 'Paquete no encontrado' });
    }

    const precio = Number(paqueteResult.rows[0].precio);
    const total = precio * qty;
    const codigo_qr = generateCodigoPedido();

    const result = await pool.query(
      `INSERT INTO pedidos
        (usuario_id, paquete_id, cantidad, nombre_estudiante, grado_estudiante,
         escuela, direccion_entrega, notas, total, codigo_qr)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id,
        paquete_id,
        qty,
        nombre_estudiante.trim(),
        grado_estudiante.trim(),
        escuela.trim(),
        direccion_entrega.trim(),
        notas?.trim() || null,
        total,
        codigo_qr,
      ]
    );

    const pedido = result.rows[0];
    const paqueteInfo = await pool.query(
      'SELECT nombre, grado FROM paquetes WHERE id = $1',
      [paquete_id]
    );

    res.status(201).json({
      ...pedido,
      paquete_nombre: paqueteInfo.rows[0]?.nombre,
      paquete_grado: paqueteInfo.rows[0]?.grado,
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);

    if (error.code === '23505') {
      return res.status(409).json({ message: 'Código de pedido duplicado, intenta de nuevo' });
    }

    if (error.code === '42703') {
      return res.status(500).json({ message: 'Base de datos desactualizada. Reinicia el servidor backend.' });
    }

    res.status(500).json({ message: 'Error al crear pedido' });
  }
});

export default router;
