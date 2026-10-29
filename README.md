# Backend Reserva de Canchas - Paralelismo y Concurrencia

## Inicializar proyecto

### 1. Activar entorno virtual de Python
```
.\.venv\Scripts\Activate.ps1
```

### 2. Levantar u comprobar contenedor Docker
```
docker compose up -d
docker compose ps
```

### 3. Iniciar FastAPI con el servidor de Uvicorn
```
python -m uvicorn app.main:app --reload
```