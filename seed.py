"""Crea datos de prueba (1 usuario y 1 cancha) para el simulador.

Uso (desde la raiz del proyecto, con el venv activo y PostgreSQL corriendo):
    python seed.py

Es seguro correrlo varias veces: si los datos ya existen, no los duplica.
"""
import bcrypt
from sqlalchemy import select

from app.db.database import SessionLocal
from app.models.court import Court
from app.models.reservation import Reservation  # noqa: F401 (registra el modelo)
from app.models.user import User

USER_EMAIL = "test@test.com"
USER_PASSWORD = "test1234"
COURT_NAME = "Cancha de prueba 1"


def main() -> None:
    with SessionLocal() as db:
        user = db.execute(
            select(User).where(User.email == USER_EMAIL)
        ).scalar_one_or_none()

        if user is None:
            hashed = bcrypt.hashpw(USER_PASSWORD.encode(), bcrypt.gensalt()).decode()
            user = User(
                name="Usuario de prueba",
                email=USER_EMAIL,
                hashed_password=hashed,
                role="customer",
            )
            db.add(user)
            print("Usuario creado.")
        else:
            print("El usuario ya existia.")

        court = db.execute(
            select(Court).where(Court.name == COURT_NAME)
        ).scalar_one_or_none()

        if court is None:
            court = Court(
                name=COURT_NAME,
                description="Cancha creada por seed.py para pruebas",
                price_per_hour=5000,
                players_per_team=5,
                location="Calle Falsa 123",
                surface_type="synthetic",
            )
            db.add(court)
            print("Cancha creada.")
        else:
            print("La cancha ya existia.")

        db.commit()
        db.refresh(user)
        db.refresh(court)

        print(f"\nuser_id  = {user.id}   (email: {USER_EMAIL} / pass: {USER_PASSWORD})")
        print(f"court_id = {court.id}")
        print("\nSi estos ids no son 1, cambia USER_ID y COURT_ID en simulator/common.py")


if __name__ == "__main__":
    main()
