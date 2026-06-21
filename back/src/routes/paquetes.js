import { Router } from 'express';
import pool from '../config/db.js';
import { getGradosPermitidos } from '../utils/paqueteGrados.js';

const router = Router();

function enrichPaquete(row) {
  return {
    ...row,
    grados_permitidos: getGradosPermitidos(row.grado),
  };
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, descripcion, grado, precio, contenido, imagen_color
       FROM paquetes
       WHERE activo = TRUE
       ORDER BY precio ASC`
    );

    res.json(result.rows.map(enrichPaquete));
  } catch (error) {
    console.error('Error al obtener paquetes:', error);
    res.status(500).json({ message: 'Error al obtener paquetes' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, descripcion, grado, precio, contenido, imagen_color
       FROM paquetes
       WHERE id = $1 AND activo = TRUE`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Paquete no encontrado' });
    }

    res.json(enrichPaquete(result.rows[0]));
  } catch (error) {
    console.error('Error al obtener paquete:', error);
    res.status(500).json({ message: 'Error al obtener paquete' });
  }
});

export default router;
