import pool from './db.js';

export async function ensureDatabaseSchema() {
  try {
    await pool.query(`
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_qr VARCHAR(50) UNIQUE;
    `);

    await pool.query(`
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS alcaldia VARCHAR(100);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS colonia VARCHAR(150);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS calle VARCHAR(200);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS numero_exterior VARCHAR(20);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS numero_interior VARCHAR(20);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 7);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS lng DECIMAL(10, 7);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(10);
    `);

    await pool.query(`
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pago_estado VARCHAR(30) DEFAULT 'pending';
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mp_preference_id VARCHAR(100);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(100);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await pool.query(`
      UPDATE pedidos
      SET codigo_qr = 'UE-' || id || '-' || UPPER(SUBSTRING(MD5(id::text || created_at::text) FROM 1 FOR 6))
      WHERE codigo_qr IS NULL;
    `);

    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'cliente';
    `);

    await pool.query(`
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS fecha_entrega_programada TIMESTAMP;
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS notas_entrega TEXT;
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagado_at TIMESTAMP;
    `);

    await pool.query(`
      UPDATE pedidos
      SET pagado_at = COALESCE(updated_at, created_at)
      WHERE pago_estado = 'approved' AND pagado_at IS NULL;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id SERIAL PRIMARY KEY,
        pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
        mp_payment_id VARCHAR(100) UNIQUE,
        estado_mp VARCHAR(30),
        pago_estado VARCHAR(30) NOT NULL,
        monto DECIMAL(10, 2),
        metodo_pago VARCHAR(50),
        detalle TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entregado_at TIMESTAMP;
    `);

    await pool.query(`
      INSERT INTO pagos (pedido_id, mp_payment_id, estado_mp, pago_estado, monto)
      SELECT p.id, p.mp_payment_id, 'approved', p.pago_estado, p.total
      FROM pedidos p
      WHERE p.mp_payment_id IS NOT NULL
      ON CONFLICT (mp_payment_id) DO NOTHING;
    `);
  } catch (error) {
    console.error('Error al verificar esquema de base de datos:', error.message);
    throw error;
  }
}
