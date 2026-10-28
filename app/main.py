from fastapi import FastAPI
from sqlalchemy import text

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