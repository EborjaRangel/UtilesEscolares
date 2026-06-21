import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function initDatabase() {
  const baseUrl = process.env.DATABASE_URL?.replace(/\/[^/]*$/, '/postgres');

  if (!baseUrl) {
    console.error('DATABASE_URL no está configurada');
    process.exit(1);
  }

  const adminClient = new Client({ connectionString: baseUrl });

  try {
    await adminClient.connect();
    const dbExists = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      ['Utiles Escolares']
    );

    if (dbExists.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "Utiles Escolares"`);
      console.log('Base de datos "Utiles Escolares" creada');
    } else {
      console.log('Base de datos "Utiles Escolares" ya existe');
    }
  } finally {
    await adminClient.end();
  }

  const appClient = new Client({ connectionString: process.env.DATABASE_URL });
  await appClient.connect();

  try {
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        telefono VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS paquetes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        descripcion TEXT NOT NULL,
        grado VARCHAR(50) NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        contenido JSONB NOT NULL,
        imagen_color VARCHAR(20) DEFAULT '#1E3A5F',
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        paquete_id INTEGER NOT NULL REFERENCES paquetes(id),
        cantidad INTEGER NOT NULL DEFAULT 1,
        nombre_estudiante VARCHAR(150) NOT NULL,
        grado_estudiante VARCHAR(50) NOT NULL,
        escuela VARCHAR(200) NOT NULL,
        direccion_entrega TEXT NOT NULL,
        alcaldia VARCHAR(100),
        colonia VARCHAR(150),
        calle VARCHAR(200),
        numero_exterior VARCHAR(20),
        numero_interior VARCHAR(20),
        lat DECIMAL(10, 7),
        lng DECIMAL(10, 7),
        codigo_postal VARCHAR(10),
        notas TEXT,
        total DECIMAL(10, 2) NOT NULL,
        estado VARCHAR(30) DEFAULT 'pendiente',
        codigo_qr VARCHAR(50) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await appClient.query(`
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_qr VARCHAR(50) UNIQUE;
    `);

    await appClient.query(`
      UPDATE pedidos
      SET codigo_qr = 'UE-' || id || '-' || UPPER(SUBSTRING(MD5(id::text || created_at::text) FROM 1 FOR 6))
      WHERE codigo_qr IS NULL;
    `);

    const paquetesCount = await appClient.query('SELECT COUNT(*) FROM paquetes');

    if (Number(paquetesCount.rows[0].count) === 0) {
      await appClient.query(`
        INSERT INTO paquetes (nombre, descripcion, grado, precio, contenido, imagen_color) VALUES
        (
          'Paquete Preescolar',
          'Todo lo necesario para dar el primer paso al mundo escolar con colores y diversión.',
          'Preescolar',
          1.00,
          '["Crayones gruesos (12)", "Plastilina (4 colores)", "Tijeras de punta redonda", "Block de dibujo", "Pegamento en barra", "Mochila pequeña"]'::jsonb,
          '#E76F51'
        ),
        (
          'Paquete Primaria Baja',
          'Útiles esenciales para 1° a 3° de primaria, listos para el aula.',
          '1° - 3° Primaria',
          2.50,
          '["Cuadernos profesionales (5)", "Lápices del #2 (12)", "Colores de madera (24)", "Regla de 30 cm", "Goma y sacapuntas", "Folder de colores (3)"]'::jsonb,
          '#F4B942'
        ),
        (
          'Paquete Primaria Alta',
          'Herramientas completas para 4° a 6° de primaria con enfoque académico.',
          '4° - 6° Primaria',
          3.75,
          '["Cuadernos profesionales (8)", "Plumas azul y negra (6)", "Marcadores de colores (12)", "Calculadora básica", "Compás y transportador", "Diccionario escolar"]'::jsonb,
          '#2D6A4F'
        ),
        (
          'Paquete Secundaria',
          'Paquete completo para estudiantes de secundaria con materiales avanzados.',
          'Secundaria',
          5.00,
          '["Cuadernos profesionales (10)", "Plumas de gel (6)", "Calculadora científica", "Resaltadores (5)", "Folder con broche (4)", "USB 16GB", "Diccionario y atlas"]'::jsonb,
          '#1E3A5F'
        );
      `);
      console.log('Paquetes de ejemplo insertados');
    }

    console.log('Esquema de base de datos listo');
  } finally {
    await appClient.end();
  }
}

initDatabase().catch((err) => {
  console.error('Error al inicializar la base de datos:', err.message);
  process.exit(1);
});
