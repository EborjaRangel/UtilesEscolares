import dotenv from 'dotenv';
import pg from 'pg';
import { searchPaymentsByReference } from '../services/mercadopago.js';

dotenv.config();

const pedidoId = Number(process.argv[2]);
if (!pedidoId) {
  console.error('Uso: node src/scripts/syncPedidoPago.js <pedidoId>');
  process.exit(1);
}

const payments = await searchPaymentsByReference(pedidoId);
if (payments.length === 0) {
  console.log(`Sin pagos en Mercado Pago para pedido #${pedidoId}`);
  process.exit(0);
}

const payment = payments[0];
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const result = await client.query(
  `UPDATE pedidos
   SET pago_estado = $1,
       estado = $2,
       mp_payment_id = $3,
       updated_at = CURRENT_TIMESTAMP
   WHERE id = $4
   RETURNING id, estado, pago_estado, mp_payment_id`,
  [
    payment.status === 'approved' ? 'approved' : 'pending',
    payment.status === 'approved' ? 'confirmado' : 'pendiente_pago',
    String(payment.id),
    pedidoId,
  ]
);

console.table(result.rows);
console.log('MP status:', payment.status, payment.status_detail);
await client.end();
