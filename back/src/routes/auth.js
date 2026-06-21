import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { nombre, apellido, email, password, telefono } = req.body;

  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos obligatorios son requeridos' });
  }

  try {
    const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);

    if (existing.rowCount > 0) {
      return res.status(409).json({ message: 'Este correo ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol)
       VALUES ($1, $2, $3, $4, $5, 'cliente')
       RETURNING id, nombre, apellido, email, telefono, rol, created_at`,
      [nombre.trim(), apellido.trim(), email.toLowerCase().trim(), passwordHash, telefono?.trim() || null]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol || 'cliente' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

  try {
    const result = await pool.query(
      'SELECT id, nombre, apellido, email, telefono, password_hash, rol, created_at FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    delete user.password_hash;

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol || 'cliente' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, apellido, email, telefono, rol, created_at FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
});

export default router;
