import { randomBytes } from 'crypto';

export function generateCodigoPedido() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = randomBytes(3).toString('hex').toUpperCase();
  return `UE-${date}-${random}`;
}

export function buildPedidoQrPayload(pedido) {
  return JSON.stringify({
    app: 'Utiles Escolares',
    pedidoId: pedido.id,
    codigo: pedido.codigo_qr,
    estudiante: pedido.nombre_estudiante,
    paquete: pedido.paquete_nombre || pedido.paquete_grado,
    total: Number(pedido.total),
    estado: pedido.estado,
  });
}
