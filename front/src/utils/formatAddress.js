export function formatDireccionEntrega({
  calle,
  numero_exterior,
  numero_interior,
  colonia,
  alcaldia,
  codigo_postal,
}) {
  if (!alcaldia || !colonia || !codigo_postal || !calle || !numero_exterior) {
    return '';
  }

  const interior = numero_interior?.trim() ? `, Int. ${numero_interior.trim()}` : '';

  return `${calle.trim()}, Ext. ${numero_exterior.trim()}${interior}, Col. ${colonia}, ${alcaldia}, CP ${codigo_postal}, Ciudad de México, CDMX`;
}

export function formatDireccionDisplay(pedido) {
  if (
    pedido.alcaldia &&
    pedido.colonia &&
    pedido.codigo_postal &&
    pedido.calle &&
    pedido.numero_exterior
  ) {
    return formatDireccionEntrega(pedido);
  }
  return pedido.direccion_entrega || '';
}

export function canFormatDireccion(values) {
  const coloniaNombre = values.colonia?.includes('|')
    ? values.colonia.split('|')[0]
    : values.colonia;
  return Boolean(
    values.alcaldia &&
      coloniaNombre &&
      values.codigo_postal &&
      values.calle &&
      values.numero_exterior
  );
}

export function formatDireccionFromFormValues(values) {
  const coloniaNombre = values.colonia?.includes('|')
    ? values.colonia.split('|')[0]
    : values.colonia;

  return formatDireccionEntrega({
    calle: values.calle,
    numero_exterior: values.numero_exterior,
    numero_interior: values.numero_interior,
    colonia: coloniaNombre,
    alcaldia: values.alcaldia,
    codigo_postal: values.codigo_postal,
  });
}
