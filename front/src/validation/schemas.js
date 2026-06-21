import * as Yup from 'yup';

export const registerSchema = Yup.object({
  nombre: Yup.string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .required('El nombre es obligatorio'),
  apellido: Yup.string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .required('El apellido es obligatorio'),
  email: Yup.string()
    .trim()
    .email('Correo electrónico inválido')
    .required('El correo es obligatorio'),
  telefono: Yup.string()
    .trim()
    .matches(/^[0-9+\-\s()]{7,20}$/, 'Teléfono inválido')
    .nullable(),
  password: Yup.string()
    .min(6, 'Mínimo 6 caracteres')
    .required('La contraseña es obligatoria'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Confirma tu contraseña'),
});

export const loginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('Correo electrónico inválido')
    .required('El correo es obligatorio'),
  password: Yup.string().required('La contraseña es obligatoria'),
});

export const pedidoSchema = Yup.object({
  cantidad: Yup.number()
    .min(1, 'Mínimo 1 paquete')
    .max(10, 'Máximo 10 paquetes')
    .required('La cantidad es obligatoria'),
  nombre_estudiante: Yup.string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(150, 'Máximo 150 caracteres')
    .required('El nombre del estudiante es obligatorio'),
  grado_estudiante: Yup.string().required('Selecciona el grado del estudiante'),
  escuela: Yup.string()
    .trim()
    .min(3, 'Mínimo 3 caracteres')
    .max(200, 'Máximo 200 caracteres')
    .required('La escuela es obligatoria'),
  alcaldia: Yup.string().required('Selecciona una alcaldía'),
  colonia: Yup.string().required('Selecciona una colonia'),
  codigo_postal: Yup.string()
    .matches(/^[0-9]{5}$/, 'Código postal inválido')
    .required('Selecciona alcaldía y colonia para obtener el CP'),
  numero_exterior: Yup.string()
    .trim()
    .min(1, 'Indica el número exterior')
    .max(20, 'Máximo 20 caracteres')
    .required('El número exterior es obligatorio'),
  calle: Yup.string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(200, 'Máximo 200 caracteres')
    .required('La calle es obligatoria'),
  numero_interior: Yup.string()
    .trim()
    .max(20, 'Máximo 20 caracteres')
    .nullable(),
  lat: Yup.number()
    .typeError('Confirma la ubicación en el mapa')
    .required('Confirma la ubicación en el mapa'),
  lng: Yup.number()
    .typeError('Confirma la ubicación en el mapa')
    .required('Confirma la ubicación en el mapa'),
  notas: Yup.string()
    .trim()
    .max(300, 'Máximo 300 caracteres')
    .nullable(),
});

export function createPedidoSchema(gradosPermitidos = []) {
  return pedidoSchema.shape({
    grado_estudiante: Yup.string()
      .oneOf(gradosPermitidos, 'Selecciona un grado válido para este paquete')
      .required('Selecciona el grado del estudiante'),
  });
}
