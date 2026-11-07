# Sistema de Facturación (FacturaAI)

Sistema web de facturación e inventario para Librerías El Regalito, en Guatemala: quetzal (GTQ), IVA del 12 % tomado del `impuesto_porcentaje` del producto, y certificación FEL solo a través de la API de un certificador.

**Stack:** Angular 20 + Node.js (Express 5 + Sequelize) + MySQL. El motor de predicción en Python es opcional.

## Estructura

```
Sistema de Facturacion/
├── frontend/     # Angular 20
├── backend/      # API REST, JWT y Sequelize
├── database/     # schema.sql (MySQL)
├── ai-engine/    # FastAPI opcional
└── docs/calidad/ # suite de pruebas de la API
```

## Requisitos

- Node.js 20+
- MySQL 8+
- Python 3.11+ solo si vas a usar el motor de IA o `docs/calidad/pruebas_api.py`

## 1. MySQL

1. Copia `backend/.env.example` a `backend/.env` y ajusta usuario, contraseña y `JWT_SECRET`.
2. Ejecuta `database/schema.sql`. Crea la base `sistema_facturacion`, las tablas y un usuario local de demostración.

Al arrancar, el backend sincroniza los modelos y aplica los ajustes de esquema (`ensure-*-schema`).

El usuario de demostración existe solo en la base local para poder entrar la primera vez. La pantalla de login no muestra ni rellena esa contraseña. Cámbiala antes de publicar el sistema:

| Campo    | Valor            |
| -------- | ---------------- |
| Email    | `admin@demo.com` |
| Password | `Admin123!`      |

```bash
cd backend
npm run hash-password -- MiNuevaClave
```

## 2. Backend

```bash
cd backend
npm install
npm run dev
```

- API: http://localhost:3000
- Salud: http://localhost:3000/api/health
- CORS: origen `FRONTEND_URL` (por defecto `http://localhost:4200`)

El pool de MySQL admite 20 conexiones. Las ventas corren dentro de una sola transacción, así varias cajas pueden facturar a la vez sin agotar las conexiones.

Salvo login y salud, las rutas piden `Authorization: Bearer <token>`.

Después de 5 contraseñas incorrectas del mismo correo, el login responde `429` durante 15 minutos.

Roles:

| Rol | Puede |
| --- | ----- |
| `admin` | Todo, incluida anulación, cobro y configuración de inventario |
| `contador` | Anular facturas y registrar cobros |
| `vendedor` | Vender. No anula facturas ni cambia el bloqueo de stock |

Un JSON mal formado responde `400`. El NIT de clientes y proveedores acepta dígitos (con guion opcional) o `CF`.

## 3. Frontend

```bash
cd frontend
npm install
npm start
```

App: http://localhost:4200  
La API se configura en `frontend/src/environments/environment.ts` (`apiUrl`).

## 4. Factura electrónica (FEL)

La certificación no se simula. El sistema no genera un UUID local ni marca una factura como aceptada por la SAT si el certificador no respondió.

Mientras `FEL_API_URL`, `FEL_API_TOKEN` y `FEL_NIT_EMISOR` estén vacíos, la factura se guarda con `autorizacion` vacía y `tributacion = no_entregado`. Esa conexión es lo único que queda pendiente para operar ante la SAT.

Cuando el certificador entregue el acceso, completa en `backend/.env`:

```
FEL_API_URL=https://certificador.example/api
FEL_API_TOKEN=token_del_certificador
FEL_NIT_EMISOR=12345678
FEL_NOMBRE_EMISOR=Librerías El Regalito
FEL_ESTABLECIMIENTO=1
```

La API espera:

| Método | Ruta | Uso |
| ------ | ---- | --- |
| `POST` | `{FEL_API_URL}/dte` | Certificar. Debe responder `{ "autorizacion", "serie", "numero_dte" }` |
| `POST` | `{FEL_API_URL}/dte/anular` | Anular un DTE ya autorizado |

En la aplicación, **Estado SAT** muestra si la API está conectada y permite reintentar la certificación (`POST /api/fel/certificar/:id`) con rol admin o contador. El cliente de la API no puede cambiar `tributacion` por su cuenta.

## 5. Motor de IA (opcional)

```bash
cd ai-engine
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

El backend reenvía `/api/ai/*` hacia `AI_ENGINE_URL`.

## Módulos

| Área | Qué hace |
| ---- | -------- |
| Auth | Login, JWT, roles y límite de intentos |
| Dashboard | Resumen en quetzales e IVA |
| Facturas y POS | Emisión con IVA 12 %, listado, seguimiento, PDF e impresión |
| FEL | Envío real al certificador; sin credenciales queda pendiente de autorización |
| Notas | Crédito desde devoluciones, débito como cargo y anulación con devolución de stock |
| Cotizaciones | Crear, editar y convertir una sola vez a factura |
| Compras | Ingreso de stock. Rechaza precios negativos |
| Inventario | Catálogo, almacenes, existencias, kárdex, ajustes, traslados, devoluciones, toma física, listas de precios y reportes |
| Cuentas | Cuentas por cobrar y por pagar, con registro de cobro o pago |
| Operación | Gastos, anticipos, recurrentes, cajas, calendario, empresa y soporte |
| IA | Pedido sugerido, si el motor Python está encendido |

Reglas de inventario al facturar:

- Con «bloquear ventas sin stock», la venta se rechaza si la suma de las líneas del mismo producto supera la existencia.
- Sin ese bloqueo, la venta se registra y el stock no baja de cero.
- Anular una factura devuelve al kárdex lo que la venta había descontado.

## API

| Prefijo | Uso |
| ------- | --- |
| `POST /api/auth/login` | Inicio de sesión |
| `POST /api/auth/usuarios` | Alta de usuario (solo admin) |
| `GET /api/auth/me` | Usuario actual |
| `GET /api/dashboard` | Resumen |
| `/api/clientes` | Clientes |
| `/api/proveedores` | Proveedores |
| `/api/productos` | Artículos y servicios |
| `/api/facturas` | Facturas. `PATCH` con `estado: anulada` o `cancelada` |
| `GET /api/fel/estado` | Si la API del certificador está configurada |
| `POST /api/fel/certificar/:id` | Reintenta la certificación |
| `/api/cotizaciones` | Cotizaciones. `POST /:id/facturar` convierte a factura |
| `/api/compras` | Compras |
| `/api/inventario/*` | Configuración, catálogos, existencias, ajustes, traslados, movimientos y devoluciones |
| `/api/registros?tipo=` | Gastos, anticipos, recurrentes, cajas, notas de débito y empresa |
| `/api/ai/predict` | Proxy al motor Python |
| `GET /api/health` | Salud del backend, sin autenticación |

## Pruebas de la API

Con el backend encendido y apuntando a la misma base que usa el script:

```bash
python docs/calidad/pruebas_api.py http://localhost:3000/api
```

El script crea sus propios datos de prueba, incluido un vendedor, usando la API. El resultado queda en `docs/calidad/resultados_pruebas.json`.

## Variables de entorno (`backend/.env`)

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sistema_facturacion
JWT_SECRET=cambia_este_secreto_en_produccion
JWT_EXPIRES_IN=8h
AI_ENGINE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:4200
FEL_API_URL=
FEL_API_TOKEN=
FEL_NIT_EMISOR=
FEL_NOMBRE_EMISOR=Librerías El Regalito
FEL_ESTABLECIMIENTO=1
```

