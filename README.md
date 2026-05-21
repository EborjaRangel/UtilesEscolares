# Útiles Escolares

Sistema web para pedir paquetes de útiles escolares. Incluye registro, inicio de sesión, catálogo de paquetes por grado y gestión de pedidos.

## Tecnologías

- **Frontend:** React, Vite, Tailwind CSS, Formik, Yup, React Router
- **Backend:** Node.js, Express, JWT
- **Base de datos:** PostgreSQL (`Utiles Escolares`)

## Requisitos

- Node.js 18+
- PostgreSQL 14+ en ejecución

## Instalación

### 1. Instalar dependencias

```bash
npm run install:all
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y ajusta tus credenciales de PostgreSQL:

```bash
copy back\.env.example back\.env
```

Edita `back/.env`:

```
PORT=5000
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/Utiles Escolares
JWT_SECRET=tu_secreto_seguro
CLIENT_URL=http://localhost:5173
```

### 3. Crear la base de datos y tablas

```bash
npm run init-db
```

Esto crea la base de datos **Utiles Escolares**, las tablas y paquetes de ejemplo.

### 4. Iniciar el proyecto

En dos terminales:

```bash
# Terminal 1 — API
npm run dev:back

# Terminal 2 — Frontend
npm run dev:front
```

Abre [http://localhost:5173](http://localhost:5173)

## Funcionalidades

- Registro e inicio de sesión (Formik + Yup)
- Catálogo de paquetes por grado escolar
- Formulario de pedido con validación (Formik + Yup)
- Historial de pedidos del usuario autenticado
- Diseño intuitivo con paleta del ciclo escolar

## Estructura

```
├── front/           # Frontend React
├── back/            # API Express + PostgreSQL
└── package.json     # Scripts del monorepo
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Perfil (auth) |
| GET | `/api/paquetes` | Listar paquetes |
| GET | `/api/paquetes/:id` | Detalle paquete |
| GET | `/api/pedidos` | Mis pedidos (auth) |
| POST | `/api/pedidos` | Crear pedido (auth) |
