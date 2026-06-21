import pool from './db.js';
import { loadMercadoPagoTokenFromDb } from '../services/mercadopago.js';

export async function ensureDatabaseSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        telefono VARCHAR(20),
        rol VARCHAR(20) DEFAULT 'cliente',
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
        estado VARCHAR(30) DEFAULT 'pendiente_pago',
        codigo_qr VARCHAR(50) UNIQUE,
        pago_estado VARCHAR(30) DEFAULT 'pending',
        mp_preference_id VARCHAR(100),
        mp_payment_id VARCHAR(100),
        pagado_at TIMESTAMP,
        fecha_entrega_programada TIMESTAMP,
        notas_entrega TEXT,
        entregado_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

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

      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Compatibilidad con bases de datos creadas antes de columnas nuevas
    await pool.query(`
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_qr VARCHAR(50) UNIQUE;
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS alcaldia VARCHAR(100);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS colonia VARCHAR(150);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS calle VARCHAR(200);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS numero_exterior VARCHAR(20);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS numero_interior VARCHAR(20);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 7);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS lng DECIMAL(10, 7);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(10);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pago_estado VARCHAR(30) DEFAULT 'pending';
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mp_preference_id VARCHAR(100);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(100);
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS fecha_entrega_programada TIMESTAMP;
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS notas_entrega TEXT;
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagado_at TIMESTAMP;
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entregado_at TIMESTAMP;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'cliente';
    `);

    await pool.query(`
      UPDATE pedidos
      SET codigo_qr = 'UE-' || id || '-' || UPPER(SUBSTRING(MD5(id::text || created_at::text) FROM 1 FOR 6))
      WHERE codigo_qr IS NULL;
    `);

    await pool.query(`
      UPDATE pedidos
      SET pagado_at = COALESCE(updated_at, created_at)
      WHERE pago_estado = 'approved' AND pagado_at IS NULL;
    `);

    await pool.query(`
      INSERT INTO pagos (pedido_id, mp_payment_id, estado_mp, pago_estado, monto)
      SELECT p.id, p.mp_payment_id, 'approved', p.pago_estado, p.total
      FROM pedidos p
      WHERE p.mp_payment_id IS NOT NULL
      ON CONFLICT (mp_payment_id) DO NOTHING;
    `);

    const paquetesCount = await pool.query('SELECT COUNT(*)::int AS count FROM paquetes');

    if (paquetesCount.rows[0].count === 0) {
      await pool.query(`
        INSERT INTO paquetes (nombre, descripcion, grado, precio, contenido, imagen_color) VALUES
        (
          'Paquete Preescolar',
          'Todo lo necesario para dar el primer paso al mundo escolar con colores y diversión.',
          'Preescolar',
          5.00,
          '["Crayones gruesos (12)", "Plastilina (4 colores)", "Tijeras de punta redonda", "Block de dibujo", "Pegamento en barra", "Mochila pequeña"]'::jsonb,
          '#E76F51'
        ),
        (
          'Paquete Primaria Baja',
          'Útiles esenciales para 1° a 3° de primaria, listos para el aula.',
          '1° - 3° Primaria',
          6.00,
          '["Cuadernos profesionales (5)", "Lápices del #2 (12)", "Colores de madera (24)", "Regla de 30 cm", "Goma y sacapuntas", "Folder de colores (3)"]'::jsonb,
          '#F4B942'
        ),
        (
          'Paquete Primaria Alta',
          'Herramientas completas para 4° a 6° de primaria con enfoque académico.',
          '4° - 6° Primaria',
          7.00,
          '["Cuadernos profesionales (8)", "Plumas azul y negra (6)", "Marcadores de colores (12)", "Calculadora básica", "Compás y transportador", "Diccionario escolar"]'::jsonb,
          '#2D6A4F'
        ),
        (
          'Paquete Secundaria',
          'Paquete completo para estudiantes de secundaria con materiales avanzados.',
          'Secundaria',
          8.00,
          '["Cuadernos profesionales (10)", "Plumas de gel (6)", "Calculadora científica", "Resaltadores (5)", "Folder con broche (4)", "USB 16GB", "Diccionario y atlas"]'::jsonb,
          '#1E3A5F'
        );
      `);
    }

    await loadMercadoPagoTokenFromDb();
  } catch (error) {
    console.error('Error al verificar esquema de base de datos:', error.message);
    throw error;
  }
}
