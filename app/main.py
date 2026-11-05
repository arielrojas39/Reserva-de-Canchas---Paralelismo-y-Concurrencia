from fastapi import FastAPI
from sqlalchemy import text
from app.db.database import engine
from app.api import courts
from app.api import reservations
from app.api import auth

app = FastAPI(
    title="Sistema de Gestión de Turnos",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "message": "API de turnos funcionando",
    }


@app.get("/health/db")
def check_database():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "database": "connected",
    }

app.include_router(courts.router)
app.include_router(reservations.router)
app.include_router(auth.router)

# CORSMiddleware es el componente que interviene en las solicitudes y respuestas HTTP que atraviesan la aplicación
from fastapi.middleware.cors import CORSMiddleware

# Reglas CORS:
# 1. CORSMiddleware componente que interviene en las solicitudes y respuestas HTTP que atraviesan nuestra aplicación
# 2. allow_origins: lista de orígenes permitidos (dominios) que pueden acceder a la API
# 3. allow_credentials: permite el envío de cookies y credenciales en las solicitudes, como cookies o autenticacion HTTP
# 4. allow_methods: lista de métodos HTTP permitidos (GET, POST, PUT, DELETE, etc.) para las solicitudes
# 5. allow_headers: lista de encabezados HTTP permitidos en las solicitudes, como Content-Type, Authorization, etc.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)