# Útiles Escolares

Sistema web para pedir paquetes de útiles escolares. Incluye registro, inicio de sesión, catálogo de paquetes por grado y gestión de pedidos.

## Tecnologías

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Formik, Yup, Mapbox
- **Backend:** Node.js, Express, JWT
- **Base de datos:** PostgreSQL (`Utiles Escolares`)

## Requisitos

- Node.js 18+
- PostgreSQL 14+ en ejecución
- Token de [Mapbox](https://account.mapbox.com/) para el mapa de entrega
- Cuenta de [Mercado Pago Developers](https://www.mercadopago.com.mx/developers) para pagos con tarjeta

## Instalación

### 1. Instalar dependencias

```bash
npm run install:all
```

### 2. Configurar variables de entorno

**Backend** — copia el ejemplo y ajusta tus credenciales:

```bash
copy back\.env.example back\.env
```

```
PORT=5000
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/Utiles Escolares
JWT_SECRET=tu_secreto_seguro
CLIENT_URL=http://localhost:3000
API_URL=http://localhost:5000
MP_ACCESS_TOKEN=tu_access_token_de_mercadopago
MP_SANDBOX=true
```

**Frontend** — token de Mapbox:

```bash
copy front\.env.local.example front\.env.local
```

```
NEXT_PUBLIC_MAPBOX_TOKEN=tu_token_de_mapbox
```

### 3. Crear la base de datos y tablas

```bash
npm run init-db
```

### 4. Iniciar el proyecto

En dos terminales:

```bash
# Terminal 1 — API
npm run dev:back

# Terminal 2 — Frontend (Next.js)
npm run dev:front
```

Abre [http://localhost:3000](http://localhost:3000)

## Formulario de pedido

Al pedir un paquete, la dirección se captura con:

- **Alcaldía**, **colonia**, **código postal**, **número exterior** e **interior**
- **Mapbox** — marca el punto exacto de entrega (coordenadas)
- Validación con **Formik + Yup**

Al confirmar, el pedido se crea y se redirige a **Mercado Pago** para pagar con tarjeta de crédito, débito, Visa, Carnet o American Express.

## Pagos (Mercado Pago)

1. Crea una aplicación en [Mercado Pago Developers](https://www.mercadopago.com.mx/developers/panel/app)
2. Copia el **Access Token** de prueba o producción en `back/.env` como `MP_ACCESS_TOKEN`
3. Usa `MP_SANDBOX=true` con credenciales de prueba
4. Tarjetas de prueba: [documentación MP](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards)

Flujo: confirmar pedido → pasarela Mercado Pago → regreso a `/pedido/pago/exito` con QR del pedido pagado.

## Estructura

```
├── front/           # Frontend Next.js
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
| POST | `/api/pedidos` | Crear pedido y abrir checkout (auth) |
| POST | `/api/pagos/checkout/:id` | Reabrir pago de pedido pendiente (auth) |
| GET | `/api/pagos/verificar/:id` | Verificar pago tras regreso de MP (auth) |
| POST | `/api/pagos/webhook` | Webhook de Mercado Pago |
