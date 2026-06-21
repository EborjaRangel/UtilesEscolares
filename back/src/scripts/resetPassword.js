import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const EMAIL = (process.argv[2] || '').toLowerCase().trim();
const PASSWORD = process.argv[3] || '';

async function resetPassword() {
  if (!EMAIL || !PASSWORD) {
    console.error('Uso: node src/scripts/resetPassword.js <email> <nueva-contraseña>');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no está configurada');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const existing = await client.query('SELECT id, email FROM usuarios WHERE email = $1', [EMAIL]);

    if (existing.rowCount === 0) {
      console.error(`No existe un usuario con el correo: ${EMAIL}`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    await client.query('UPDATE usuarios SET password_hash = $1 WHERE email = $2', [
      passwordHash,
      EMAIL,
    ]);

    console.log(`Contraseña actualizada para: ${EMAIL}`);
  } finally {
    await client.end();
  }
}

resetPassword().catch((err) => {
  console.error('Error al resetear contraseña:', err.message);
  process.exit(1);
});
