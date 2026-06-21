import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@losutilesya.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@LosUtiles2026';
const ADMIN_NOMBRE = process.env.ADMIN_NOMBRE || 'Administrador';
const ADMIN_APELLIDO = process.env.ADMIN_APELLIDO || 'Los Utiles Ya';

async function createAdmin() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no está configurada');
    process.exit(1);
  }

  await client.connect();

  try {
    await client.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'cliente';
    `);

    const existing = await client.query('SELECT id, email, rol FROM usuarios WHERE email = $1', [
      ADMIN_EMAIL,
    ]);

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    if (existing.rowCount > 0) {
      await client.query(
        `UPDATE usuarios
         SET nombre = $1, apellido = $2, password_hash = $3, rol = 'admin'
         WHERE email = $4`,
        [ADMIN_NOMBRE, ADMIN_APELLIDO, passwordHash, ADMIN_EMAIL]
      );
      console.log(`Usuario admin actualizado: ${ADMIN_EMAIL}`);
    } else {
      await client.query(
        `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol)
         VALUES ($1, $2, $3, $4, 'admin')`,
        [ADMIN_NOMBRE, ADMIN_APELLIDO, ADMIN_EMAIL, passwordHash]
      );
      console.log(`Usuario admin creado: ${ADMIN_EMAIL}`);
    }

    console.log('');
    console.log('Credenciales de acceso (inicia sesión en /login):');
    console.log(`  Correo:     ${ADMIN_EMAIL}`);
    console.log(`  Contraseña: ${ADMIN_PASSWORD}`);
    console.log('');
  } finally {
    await client.end();
  }
}

createAdmin().catch((err) => {
  console.error('Error al crear admin:', err.message);
  process.exit(1);
});
