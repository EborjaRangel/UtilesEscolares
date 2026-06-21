export function formatDireccionEntrega({
  calle,
  numero_exterior,
  numero_interior,
  colonia,
  alcaldia,
  codigo_postal,
}) {
  if (!alcaldia || !colonia || !codigo_postal || !calle || !numero_exterior) {
    return null;
  }

  const interior = numero_interior?.trim() ? `, Int. ${numero_interior.trim()}` : '';

  return `${calle.trim()}, Ext. ${numero_exterior.trim()}${interior}, Col. ${colonia}, ${alcaldia}, CP ${codigo_postal}, Ciudad de México, CDMX`;
}

export function buildDireccionEntrega(body) {
  const colonia = body.colonia?.trim();
  const alcaldia = body.alcaldia?.trim();
  const codigo_postal = body.codigo_postal?.trim();
  const calle = body.calle?.trim();
  const numero_exterior = body.numero_exterior?.trim();

  if (!alcaldia || !colonia || !codigo_postal || !calle || !numero_exterior) {
    return null;
  }

  return formatDireccionEntrega({
    calle,
    numero_exterior,
    numero_interior: body.numero_interior?.trim() || '',
    colonia,
    alcaldia,
    codigo_postal,
  });
}
