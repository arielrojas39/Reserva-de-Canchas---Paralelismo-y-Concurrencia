from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import auth
from app.api import courts
from app.api import reservations
from app.api import payments
from app.core.config import settings
from app.db.database import engine

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
app.include_router(payments.router)

# CORSMiddleware: interviene en solicitudes y respuestas HTTP.
# Los orígenes se configuran desde la variable de entorno FRONTEND_ORIGINS,
# separados por comas. Nunca se usa "*" cuando allow_credentials=True.
_frontend_origins = [
    origin.strip()
    for origin in settings.FRONTEND_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_frontend_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)