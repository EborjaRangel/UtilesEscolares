export function gradoEstudianteOptions(gradosPermitidos = []) {
  if (gradosPermitidos.length === 0) {
    return [{ value: '', label: 'Grado no disponible para este paquete' }];
  }

  if (gradosPermitidos.length === 1) {
    return [{ value: gradosPermitidos[0], label: gradosPermitidos[0] }];
  }

  return [
    { value: '', label: 'Selecciona el grado' },
    ...gradosPermitidos.map((grado) => ({ value: grado, label: grado })),
  ];
}

export function gradoEstudianteInicial(gradosPermitidos = []) {
  return gradosPermitidos.length === 1 ? gradosPermitidos[0] : '';
}
