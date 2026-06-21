export const ENTREGA_MAX_HORAS = 72;
export const ENTREGA_MAX_MS = ENTREGA_MAX_HORAS * 60 * 60 * 1000;

export function getEntregaLimite(pagadoAt) {
  if (!pagadoAt) return null;
  return new Date(new Date(pagadoAt).getTime() + ENTREGA_MAX_MS);
}

export function entregaVencida(pagadoAt, estado) {
  if (!pagadoAt || estado === 'entregado') return false;
  const limite = getEntregaLimite(pagadoAt);
  return limite ? Date.now() > limite.getTime() : false;
}

export function tiempoRestanteEntrega(pagadoAt, estado) {
  if (!pagadoAt || estado === 'entregado') return null;
  const limite = getEntregaLimite(pagadoAt);
  if (!limite) return null;
  return limite.getTime() - Date.now();
}

export function formatTiempoRestante(ms) {
  if (ms == null) return '';
  if (ms <= 0) return 'Plazo vencido';

  const horas = Math.floor(ms / (1000 * 60 * 60));
  const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (horas >= 24) {
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    return `${dias}d ${horasRestantes}h restantes`;
  }

  return `${horas}h ${minutos}m restantes`;
}
