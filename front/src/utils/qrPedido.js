export function buildPedidoQrUrl(codigo) {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/consultar-pedido/${encodeURIComponent(codigo)}`;
}
