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



### 8. Iniciar FastAPI con Uvicorn

```powershell
python -m uvicorn app.main:app --reload
```

### 9. Probar la API

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

## Notas importantes a tener en cuenta

* El archivo `.env` no debe subirse al repositorio.
* Cada integrante debe configurar sus propias variables de entorno.
* No es necesario compartir la carpeta `.venv`.
* PostgreSQL se ejecuta mediante Docker Compose.
* Cada integrante tendrá su propia instancia local de PostgreSQL y sus propios datos.
* Las migraciones de Alembic permiten mantener sincronizada la estructura de la base de datos.
* No utilizar `docker compose down -v` salvo que se quiera eliminar también el volumen con los datos de PostgreSQL.
