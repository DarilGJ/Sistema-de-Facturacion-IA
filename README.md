# Sistema de Facturación (FacturaAI)

Proyecto de graduación: sistema web de facturación e inventario para Guatemala (moneda Quetzal, IVA 12%).

**Stack:** Angular 20 + Node.js (Express 5 + Sequelize) + MySQL + Python (FastAPI) para el motor de IA.

## Estructura

```
Sistema de Facturacion/
├── frontend/     # Angular 20 — login, dashboard y módulos
├── backend/      # API REST + JWT + Sequelize
├── database/     # schema.sql (MySQL)
└── ai-engine/    # stub FastAPI (prediccion / salud)
```

## Requisitos

- Node.js 20+
- MySQL 8+
- Python 3.11+ (solo si usas el motor de IA)

## 1. MySQL

1. Instala MySQL Server (Workbench, XAMPP o similar).
2. Copia `backend/.env.example` a `backend/.env` y ajusta usuario, contraseña y `JWT_SECRET`.
3. Ejecuta `database/schema.sql` en MySQL. Crea la base `sistema_facturacion`, las tablas y el usuario demo.

Al arrancar, el backend también sincroniza modelos Sequelize y aplica ajustes de esquema (`ensure-*-schema`) por si la base ya existía.

**Usuario demo**

| Campo    | Valor            |
| -------- | ---------------- |
| Email    | `admin@demo.com` |
| Password | `Admin123!`      |

Para generar otro hash bcrypt:

```bash
cd backend
npm run hash-password -- MiNuevaClave
```

## 2. Backend (Node.js)

```bash
cd backend
npm install
npm run dev
```

- API: http://localhost:3000
- Health: http://localhost:3000/api/health
- CORS: origen `FRONTEND_URL` (por defecto `http://localhost:4200`)

Las rutas de negocio (excepto login y health) requieren JWT en `Authorization: Bearer <token>`.

## 3. Frontend (Angular)

```bash
cd frontend
npm install
npm start
```

App: http://localhost:4200  
La API se configura en `frontend/src/environments/environment.ts` (`apiUrl`).

Tras el login, Angular guarda el JWT, protege rutas con guard e interceptor, y entra a `/dashboard`.

## 4. Motor IA (Python) — opcional

```bash
cd ai-engine
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Docs: http://localhost:8000/docs  
El backend reenvía hacia Python en `/api/ai/*`.

## Módulos de la aplicación

| Área | Qué hay hoy |
| ---- | ----------- |
| **Auth** | Login, sesión JWT, roles (`admin`, `vendedor`, `contador`) |
| **Dashboard** | Resumen operativo y alertas |
| **POS / facturas** | Crear factura, listado, seguimiento, impresión/PDF |
| **Notas** | Listados de crédito, débito y anulación (según estado de facturas) |
| **Cotizaciones** | Crear, listar, editar, convertir a factura |
| **Compras** | Crear y listar compras a proveedores (ingreso de stock) |
| **Inventario** | Productos, categorías, subcategorías, marcas, almacenes, existencias, movimientos, ajustes, traslados, devoluciones, configuración |
| **Clientes / proveedores** | CRUD con baja lógica |
| **Contabilidad** | Pantalla de libros / ITBIS / CxC (en desarrollo) |
| **Placeholders** | Recurrentes, gastos, anticipos, CxC/CxP, cajas POS, SAT, reportes de inventario, configuración general |

## API (resumen)

| Prefijo | Uso |
| ------- | --- |
| `POST /api/auth/login` | Inicio de sesión |
| `GET /api/auth/me` | Usuario actual |
| `GET /api/dashboard` | Resumen |
| `GET /api/dashboard/alertas` | Alertas |
| `/api/clientes` | Clientes |
| `/api/proveedores` | Proveedores |
| `/api/productos` | Artículos y servicios |
| `/api/facturas` | Facturas |
| `/api/cotizaciones` | Cotizaciones (`POST /:id/facturar` convierte a factura) |
| `/api/compras` | Compras |
| `/api/inventario/*` | Config, catálogos, existencias, ajustes, traslados, movimientos, devoluciones |
| `/api/ai/predict` | Proxy al motor Python |
| `GET /api/health` | Salud del backend (sin auth) |

## Flujo de autenticación

1. Angular envía email/password a `POST /api/auth/login`.
2. Node valida contra MySQL (bcrypt) y responde un JWT.
3. El interceptor adjunta el token; el guard bloquea rutas privadas.
4. El layout del dashboard carga menú, búsqueda y módulos.

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
```

No subas `.env` al repositorio. Usa `.env.example` como plantilla.
