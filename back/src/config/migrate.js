import pool from './db.js';

export async function ensureDatabaseSchema() {
  try {
    await pool.query(`
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_qr VARCHAR(50) UNIQUE;
    `);

    await pool.query(`
      UPDATE pedidos
      SET codigo_qr = 'UE-' || id || '-' || UPPER(SUBSTRING(MD5(id::text || created_at::text) FROM 1 FOR 6))
      WHERE codigo_qr IS NULL;
    `);
  } catch (error) {
    console.error('Error al verificar esquema de base de datos:', error.message);
    throw error;
  }
}
