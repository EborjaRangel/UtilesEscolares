export const ENTREGA_MAX_HORAS = 72;
export const ENTREGA_MAX_MS = ENTREGA_MAX_HORAS * 60 * 60 * 1000;

export function getEntregaLimite(pagadoAt) {
  if (!pagadoAt) return null;
  return new Date(new Date(pagadoAt).getTime() + ENTREGA_MAX_MS);
}

export function validarFechaEntrega(pagadoAt, fechaEntrega) {
  if (!pagadoAt) {
    return { ok: false, message: 'El pedido aún no tiene fecha de pago registrada' };
  }

  const fecha = new Date(fechaEntrega);
  if (Number.isNaN(fecha.getTime())) {
    return { ok: false, message: 'Fecha de entrega inválida' };
  }

  const pagado = new Date(pagadoAt);
  const limite = getEntregaLimite(pagadoAt);

  if (fecha < pagado) {
    return { ok: false, message: 'La entrega no puede ser anterior al pago' };
  }

  if (fecha > limite) {
    return {
      ok: false,
      message: `La entrega debe programarse dentro de ${ENTREGA_MAX_HORAS} horas desde el pago`,
      limite,
    };
  }

  return { ok: true, limite };
}

export function entregaVencida(pagadoAt, estado) {
  if (!pagadoAt || estado === 'entregado') return false;
  const limite = getEntregaLimite(pagadoAt);
  return limite ? Date.now() > limite.getTime() : false;
}
