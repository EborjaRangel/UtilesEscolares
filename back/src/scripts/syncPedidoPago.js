import dotenv from 'dotenv';
import { ensureMercadoPagoTokenLoaded } from '../services/mercadopago.js';
import { syncPedidoFromMercadoPago } from '../services/pedidoPago.js';

dotenv.config();

const pedidoId = Number(process.argv[2]);

if (!pedidoId) {
  console.error('Uso: node src/scripts/syncPedidoPago.js <pedidoId>');
  process.exit(1);
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error('DATABASE_URL no está configurada');
  process.exit(1);
}

await ensureMercadoPagoTokenLoaded();

const updated = await syncPedidoFromMercadoPago(pedidoId);

if (!updated) {
  console.log(`Sin pagos en Mercado Pago para pedido #${pedidoId}`);
  process.exit(0);
}

console.log('Pedido actualizado:');
console.table([
  {
    id: updated.id,
    estado: updated.estado,
    pago_estado: updated.pago_estado,
    mp_payment_id: updated.mp_payment_id,
    pagado_at: updated.pagado_at,
  },
]);

process.exit(0);
