import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import paquetesRoutes from './routes/paquetes.js';
import pedidosRoutes from './routes/pedidos.js';
import pagosRoutes from './routes/pagos.js';
import adminCajaRoutes from './routes/admin/caja.js';
import { isMercadoPagoConfigured, isMockPaymentMode, getSellerMode, loadMercadoPagoTokenFromDb } from './services/mercadopago.js';
import { ensureDatabaseSchema } from './config/migrate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Útiles Escolares API funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/paquetes', paquetesRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/admin/caja', adminCajaRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

ensureDatabaseSchema()
  .then(() => loadMercadoPagoTokenFromDb())
  .then(() => {
    if (isMockPaymentMode()) {
      console.warn('⚠️  MP_PAYMENT_MODE=mock — pagos simulados, no se usa Mercado Pago real.');
    } else if (!isMercadoPagoConfigured()) {
      console.warn(
        '⚠️  MP_ACCESS_TOKEN no configurado. Los pagos con Mercado Pago no funcionarán hasta agregarlo en back/.env'
      );
    } else {
      getSellerMode().then((sellerMode) => {
        console.log(
          `✓ Mercado Pago configurado (${sellerMode === 'production' ? 'PRODUCCIÓN' : 'PRUEBA'})`
        );

        if (sellerMode === 'production') {
          console.log('   Pagos reales con tarjeta de crédito o débito.');
        } else if (sellerMode === 'test') {
          console.warn('⚠️  Tu Access Token es de cuenta de PRUEBA de Mercado Pago (test_user).');
          console.warn('   No podrás cobrar con tarjeta real hasta activar producción en:');
          console.warn('   https://www.mercadopago.com.mx/developers/panel/app');
          console.warn('   Mientras tanto, en checkout usa tarjeta 4509 9535 6623 3704, titular APRO.');
        }
      });
    }

    const server = app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ El puerto ${PORT} ya está en uso.`);
        console.error('   Cierra la otra terminal con el backend o ejecuta:');
        console.error(`   netstat -ano | findstr :${PORT}`);
        console.error('   taskkill /PID <numero> /F\n');
        process.exit(1);
      }
      throw err;
    });
  })
  .catch((error) => {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  });
