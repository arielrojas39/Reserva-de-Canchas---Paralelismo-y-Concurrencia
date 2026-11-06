# Backend Reserva de Canchas - Paralelismo y Concurrencia

## Requisitos previos

* Git.
* Python 3.14.
* Docker Desktop instalado y ejecutándose.

**Nota:** No es necesario instalar PostgreSQL localmente. Docker Compose se encarga de ejecutar el servidor de base de datos dentro de un contenedor.

## Inicializar el proyecto

### 1. Clonar el repositorio

```powershell
git clone https://github.com/arielrojas39/Reserva-de-Canchas---Paralelismo-y-Concurrencia
```

Ingresar a la carpeta del proyecto:

```powershell
cd "Backend Reserva de Canchas"
```

### 2. Crear el entorno virtual de Python

Este paso se realiza únicamente la primera vez.

```powershell
python -m venv .venv
```

### 3. Activar el entorno virtual

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. Instalar las dependencias

```powershell
pip install -r requirements.txt
```

### 5. Configurar las variables de entorno

Crear una copia del archivo `.env.example` y nombrarla `.env`.

```powershell
Copy-Item .env.example .env
```

#### Descripcion de las variables:

* `DATABASE_URL`: dirección de conexión a PostgreSQL. Al utilizar `docker-compose.yml` original, los valores ya están configurados para funcionar localmente.
* `JWT_SECRET`: clave secreta utilizada para firmar los tokens de autenticación. Cada integrante debe generar su propia clave.
* `JWT_ALGORITHM`: algoritmo utilizado para firmar los tokens.
* `JWT_EXPIRE_MINUTES`: tiempo de expiración de los tokens en minutos.
* `FRONTEND_ORIGINS`: orígenes del frontend permitidos por CORS, separados por comas. Ejemplo: `http://localhost:3000,http://127.0.0.1:3000`. Nunca se usa `*` cuando se envían credenciales.
* `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`: credenciales opcionales para crear el administrador inicial con `scripts/seed.py`. Si falta alguna, el seed omitirá la creación del admin.
* `MP_ACCESS_TOKEN`: Access Token de Mercado Pago. En desarrollo usar el de **Prueba**; nunca exponerlo en el frontend.
* `MP_WEBHOOK_SECRET`: clave secreta que muestra Mercado Pago al configurar el webhook. Obligatoria en producción.
* `MP_ENVIRONMENT`: `sandbox` o `production`.
* `MP_WEBHOOK_URL`: URL pública HTTPS del webhook, por ejemplo `https://abc.ngrok-free.app/payments/webhook`.
* `MP_STATEMENT_DESCRIPTOR`: texto que verá el pagador en el resumen (máx. 22 caracteres).
* `FRONTEND_URL`: URL pública del frontend para volver después del checkout.

### 6. Levantar PostgreSQL con Docker

```powershell
docker compose up -d
```

Comprobar que el contenedor esté funcionando:

```powershell
docker compose ps
```

### 7. Ejecutar las migraciones de Alembic

Este comando crea o actualiza las tablas de PostgreSQL según las migraciones del proyecto.

```powershell
alembic upgrade head
```

### 8. Cargar datos iniciales (seed local)

El seed crea 4 canchas de ejemplo y, si están configuradas las variables `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` y `SEED_ADMIN_NAME`, un usuario administrador.

```powershell
python -m scripts.seed
```

Si faltan las credenciales de administrador, el script solo cargará las canchas y mostrará un aviso.

### 9. Iniciar FastAPI con Uvicorn

```powershell
python -m uvicorn app.main:app --reload
```

### 10. Probar la API

* API: http://127.0.0.1:8000
* Documentación Swagger: http://127.0.0.1:8000/docs
* Verificación de conexión a PostgreSQL: http://127.0.0.1:8000/health/db
* OpenAPI JSON: http://localhost:8000/openapi.json

## Detener los servicios

Para detener FastAPI, presionar `Ctrl + C` en la terminal donde se está ejecutando Uvicorn.

Para detener PostgreSQL sin eliminar los datos almacenados:

```powershell
docker compose stop
```

Para volver a iniciar PostgreSQL:

```powershell
docker compose start
```

## Endpoints de reservas

Todos requieren autenticación con `Authorization: Bearer <token>`, salvo `/courts/{id}/availability`.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/reservations` | Crear una reserva. Body: `{court_id, date, time}`. |
| `GET`  | `/reservations/me` | Listar las reservas del usuario autenticado. |
| `GET`  | `/reservations/{id}` | Ver una reserva (dueño o admin). |
| `POST` | `/reservations/{id}/cancel` | Cancelar una reserva `pending`/`confirmed` (dueño o admin). |
| `GET`  | `/reservations` | Listar todas las reservas (solo admin). |
| `GET`  | `/courts/{id}/availability?date=YYYY-MM-DD` | Horarios disponibles de una cancha. |

## Endpoints de pago (Mercado Pago Checkout Pro)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/payments/preferences` | Crea una preferencia para una reserva `pending`. Body: `{reservation_id}`. Devuelve `checkout_url`. |
| `GET`  | `/payments/reservations/{id}` | Estado del último intento de pago (dueño o admin). |
| `POST` | `/payments/webhook` | Recibe la notificación de Mercado Pago, valida la firma y confirma la reserva. |

El webhook requiere `MP_WEBHOOK_SECRET` en producción. En sandbox, si no está configurado, se acepta la notificación con una advertencia en logs para facilitar las pruebas locales. La reserva pasa a `confirmed` solo si el pago está `approved`, la moneda es `ARS` y el monto coincide.

Los tests no llaman a Mercado Pago: usan un SDK falso y verifican preferencia, webhook y confirmación.

## Tests

```powershell
# Compilar todo el proyecto
python -m compileall app

# Ejecutar los tests
pytest
```

El test `tests/test_reservation_flow.py` cubre registro, login, creación, listado, cancelación y conflicto de reservas usando SQLite en memoria, sin necesidad de un servidor externo.

## Notas importantes a tener en cuenta

* El archivo `.env` no debe subirse al repositorio.
* Cada integrante debe configurar sus propias variables de entorno.
* No es necesario compartir la carpeta `.venv`.
* PostgreSQL se ejecuta mediante Docker Compose.
* Cada integrante tendrá su propia instancia local de PostgreSQL y sus propios datos.
* Las migraciones de Alembic permiten mantener sincronizada la estructura de la base de datos.
* No utilizar `docker compose down -v` salvo que se quiera eliminar también el volumen con los datos de PostgreSQL.
