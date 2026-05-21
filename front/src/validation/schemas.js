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
  password: Yup.string()
    .required('La contraseña es obligatoria'),
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
  grado_estudiante: Yup.string()
    .required('Selecciona el grado del estudiante'),
  escuela: Yup.string()
    .trim()
    .min(3, 'Mínimo 3 caracteres')
    .max(200, 'Máximo 200 caracteres')
    .required('La escuela es obligatoria'),
  direccion_entrega: Yup.string()
    .trim()
    .min(10, 'Describe la dirección con más detalle')
    .max(500, 'Máximo 500 caracteres')
    .required('La dirección de entrega es obligatoria'),
  notas: Yup.string()
    .trim()
    .max(300, 'Máximo 300 caracteres')
    .nullable(),
});
