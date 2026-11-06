# CanchasPlay — Backend + Frontend

Monorepo local con dos proyectos independientes:

| Carpeta   | Stack                                                        | Puerto |
| --------- | ------------------------------------------------------------ | ------ |
| `api/`    | FastAPI, SQLAlchemy 2, PostgreSQL 16, Alembic                | `8000` |
| `client/` | Next.js 16 (App Router), React 19, TypeScript, SCSS Modules  | `3000` |

El cliente funciona en **modo demo** (localStorage) si no se configura la API, o
en **modo real** contra FastAPI si se define `NEXT_PUBLIC_API_URL`.

## 1. Requisitos

- Docker Desktop
- Python 3.14
- Node.js 20.9+ y pnpm 12+

## 2. Levantar PostgreSQL

```powershell
cd api
docker compose up -d
docker compose ps
```

PostgreSQL queda en `localhost:5434` (base `turnos`, usuario `postgres`).

## 3. Preparar el backend

```powershell
cd api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

Copy-Item .env.example .env
# Editar .env:
#   DATABASE_URL=postgresql://postgres:postgres@localhost:5434/turnos
#   JWT_SECRET=<clave aleatoria de al menos 32 bytes>
#   FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
#   SEED_ADMIN_EMAIL=admin@canchasplay.com
#   SEED_ADMIN_PASSWORD=<contraseña local>
#   SEED_ADMIN_NAME=Administrador CanchasPlay

alembic upgrade head
python -m scripts.seed
python -m uvicorn app.main:app --reload
```

Verificación rápida:

- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/health/db
- http://127.0.0.1:8000/courts

> El seed es idempotente: crea 4 canchas y el admin solo si no existen.
> `SEED_ADMIN_EMAIL` debe ser un correo válido (no uses `.local`).

## 4. Preparar el frontend

```powershell
cd client
pnpm install
Copy-Item .env.example .env.local
# Descomentar:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
pnpm dev
```

> Los tipos de la API se generan desde FastAPI con `pnpm generate:api`
> (`lib/api/schema.d.ts`). No se editan a mano.

Abrir http://localhost:3000.

> `NEXT_PUBLIC_*` se incorpora al bundle al compilar. Si cambiás la URL, reiniciá
> `pnpm dev` o volvé a ejecutar `pnpm build`.

## 5. Probar el flujo real

1. Entrar a `/login` con el admin del seed.
2. Ir a `/canchas`: deben aparecer las 4 canchas del backend, no las de demo.
3. Elegir una fecha y un horario libre.
4. Reservar y confirmar.
5. Ver la reserva en `/mis-reservas`.
6. Verificar por API:

```powershell
$token = (Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:8000/auth/login `
  -ContentType "application/json" `
  -Body '{"email":"admin@canchasplay.com","password":"<contraseña>"}').access_token

Invoke-RestMethod http://127.0.0.1:8000/reservations/me `
  -Headers @{ Authorization = "Bearer $token" }
```

## 6. Qué está conectado

| Función | Estado |
| --- | --- |
| Registro, login, `/auth/me` | Real |
| Catálogo de canchas | Real |
| Disponibilidad por fecha | Real |
| Crear reserva | Real |
| Listar mis reservas | Real |
| Cancelar reserva (API + UI) | Real, con confirmación y refresco |
| Pago con Mercado Pago | Implementado; requiere credenciales y webhook público |
| Panel admin | Demo |

## 7. Mercado Pago (Checkout Pro)

El backend crea la preferencia y el webhook confirma la reserva. El frontend solo
redirige al checkout; el access token nunca llega al navegador.

1. Crear una aplicación en el panel de desarrolladores:
   https://www.mercadopago.com.ar/developers/panel/app
2. En **Credenciales**, con el selector en **Prueba**, copiar el **Access Token**.
3. Completar `api/.env`:

```env
MP_ACCESS_TOKEN=APP_USR-...
MP_WEBHOOK_SECRET=<secreto que muestra Mercado Pago al configurar el webhook>
MP_ENVIRONMENT=sandbox
MP_WEBHOOK_URL=https://<tu-dominio-publico>/payments/webhook
MP_STATEMENT_DESCRIPTOR=CANCHASPLAY
FRONTEND_URL=http://localhost:3000
```

4. Exponer el backend local con HTTPS (ngrok, cloudflared o similar) y usar esa
   URL en `MP_WEBHOOK_URL`.
5. En **Webhooks** de la aplicación, configurar la URL pública y el evento
   **Pagos**. Copiar la clave secreta a `MP_WEBHOOK_SECRET`.
6. Reiniciar FastAPI y probar: reserva → “Pagar con Mercado Pago” → checkout →
   volver a `/mis-reservas`. El webhook actualiza la reserva a `confirmed`.
7. Para producción, activar la aplicación, reemplazar por credenciales de
   producción, usar una URL HTTPS estable y verificar el webhook real.

Guía ampliada: `informes/2026-11-05-ceo-mercado-pago.md`.

## 8. Comandos de calidad

```powershell
cd client
pnpm typecheck
pnpm lint
pnpm test
pnpm build

cd ..\api
.\.venv\Scripts\python.exe -m compileall -q app scripts tests
.\.venv\Scripts\python.exe -m pytest -q
```

## 9. Problemas comunes

- **No aparecen las canchas reales:** verificá `NEXT_PUBLIC_API_URL`, que FastAPI
  esté en `8000` y que `FRONTEND_ORIGINS` incluya el origen exacto del navegador.
- **401 al reservar:** el token venció; volvé a iniciar sesión.
- **409 al reservar:** otro usuario tomó el horario; se refresca la grilla.
- **Error de email en el seed:** usá un dominio válido, por ejemplo
  `admin@canchasplay.com`.
- **Puerto 3000 ocupado:** cerrá el proceso anterior o usá el puerto que indique
  Next.js.

## 10. Seguridad

El JWT se guarda en `localStorage` para este MVP. Antes de producción hay que
migrar a cookie `httpOnly` + `Secure` + `SameSite`, agregar CSRF, rate limiting
en login y CSP. El panel admin del frontend no es una frontera de seguridad: la
autorización real la aplica FastAPI.
