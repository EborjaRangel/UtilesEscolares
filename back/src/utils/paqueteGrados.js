export const GRADOS_POR_PAQUETE = {
  Preescolar: ['Preescolar'],
  '1° - 3° Primaria': ['1° Primaria', '2° Primaria', '3° Primaria'],
  '4° - 6° Primaria': ['4° Primaria', '5° Primaria', '6° Primaria'],
  Secundaria: ['1° Secundaria', '2° Secundaria', '3° Secundaria'],
};

export function getGradosPermitidos(paqueteGrado) {
  return GRADOS_POR_PAQUETE[paqueteGrado] || [];
}

export function esGradoPermitido(paqueteGrado, gradoEstudiante) {
  const permitidos = getGradosPermitidos(paqueteGrado);
  return permitidos.includes(gradoEstudiante?.trim());
}
