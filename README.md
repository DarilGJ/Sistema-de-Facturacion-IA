# Sistema de Facturación (FacturaAI)

Stack: **Angular** + **Node.js (Express)** + **MySQL** + **Python (FastAPI)** para el motor de IA.

## Estructura

```
Sistema de Facturacion/
├── frontend/     # Angular 20 - login y UI
├── backend/      # API Node.js + JWT
├── database/     # schema.sql
└── ai-engine/    # stub FastAPI para IA
```

## 1. MySQL

1. Instala MySQL Server (Workbench o XAMPP).
2. Edita `backend/.env` con tu usuario/password.
3. Ejecuta `database/schema.sql` en MySQL.

Usuario demo:

- Email: `admin@demo.com`
- Password: `Admin123!`

## 2. Backend (Node.js)

```bash
cd backend
npm install
npm run dev
```

API: http://localhost:3000  
Health: http://localhost:3000/api/health  
Login: `POST /api/auth/login`

## 3. Frontend (Angular)

```bash
cd frontend
npm start
```

App: http://localhost:4200

## 4. Motor IA (Python) — opcional

```bash
cd ai-engine
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Docs: http://localhost:8000/docs  
El backend proxyea hacia Python en `/api/ai/*`.

## Flujo del login

1. Angular envía email/password a `POST /api/auth/login`.
2. Node valida contra MySQL (bcrypt) y responde JWT.
3. Angular guarda el token y protege rutas con guard + interceptor.
4. Tras el login entras a `/dashboard` (layout vacío listo para módulos).
5. Rutas `/api/ai/*` ya están listas para conectar librerías Python.
