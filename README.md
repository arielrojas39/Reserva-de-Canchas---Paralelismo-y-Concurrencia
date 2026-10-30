# Backend Reserva de Canchas - Paralelismo y Concurrencia

## Requisitos previos

- Git
- Python 3.x
- Docker Desktop (abierto y corriendo)

## Inicializar proyecto

### 1. Crear el entorno virtual de Python (solo la primera vez)
```
python -m venv .venv
```

### 2. Activar el entorno virtual
```
.\.venv\Scripts\Activate.ps1
```

### 3. Instalar las dependencias 
```
pip install -r requirements.txt
```

### 4. Levantar y comprobar el contenedor Docker
```
docker compose up -d
docker compose ps
```

### 5. Iniciar FastAPI con el servidor de Uvicorn
```
python -m uvicorn app.main:app --reload
```

### 6. Probar la API
- API: http://127.0.0.1:8000
- Documentación: http://127.0.0.1:8000/docs