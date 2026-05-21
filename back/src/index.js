import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import paquetesRoutes from './routes/paquetes.js';
import pedidosRoutes from './routes/pedidos.js';
import { ensureDatabaseSchema } from './config/migrate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Útiles Escolares API funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/paquetes', paquetesRoutes);
app.use('/api/pedidos', pedidosRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

ensureDatabaseSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  });
