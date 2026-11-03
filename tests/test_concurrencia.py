"""Pruebas de concurrencia sobre el servicio de reservas.

Ejecutar desde la raiz del proyecto (con el venv activo y PostgreSQL arriba):
    python -m pytest tests -v

Cada test crea su propio usuario y su propia cancha, y los borra al terminar,
asi que no mezcla datos con los de desarrollo.
"""
import random
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import delete, func, select

from app.db.database import SessionLocal
from app.models.court import Court
from app.models.reservation import Reservation
from app.models.user import User
from app.services.reservation_service import (
    CourtNotFoundError,
    SlotAlreadyTakenError,
    create_reservation,
)

# Debe ser menor que pool_size + max_overflow de database.py (20 + 20)
HILOS = 30


@pytest.fixture()
def datos():
    """Crea un usuario y una cancha de prueba y los elimina al finalizar."""
    with SessionLocal() as db:
        user = User(
            name="Test concurrencia",
            email=f"test-{uuid.uuid4().hex}@test.com",
            hashed_password="no-importa",
        )
        court = Court(
            name=f"Cancha test {uuid.uuid4().hex[:8]}",
            price_per_hour=1000,
            players_per_team=5,
            location="Test",
            surface_type="synthetic",
        )
        db.add_all([user, court])
        db.commit()
        user_id, court_id = user.id, court.id

    yield user_id, court_id

    with SessionLocal() as db:
        db.execute(delete(Reservation).where(Reservation.court_id == court_id))
        db.execute(delete(Court).where(Court.id == court_id))
        db.execute(delete(User).where(User.id == user_id))
        db.commit()


def _base() -> datetime:
    return datetime(2040, 1, 1, tzinfo=timezone.utc) + timedelta(
        days=random.randint(0, 100_000)
    )


def _lanzar(user_id: int, court_id: int, horarios: list[datetime]) -> list[str]:
    """Lanza una reserva por horario, todas a la vez (una por hilo)."""
    barrera = threading.Barrier(len(horarios))

    def tarea(start: datetime) -> str:
        barrera.wait()  # todos los hilos arrancan en el mismo instante
        with SessionLocal() as db:
            try:
                create_reservation(db, user_id, court_id, start)
                return "creada"
            except SlotAlreadyTakenError:
                return "rechazada"

    with ThreadPoolExecutor(max_workers=len(horarios)) as pool:
        return list(pool.map(tarea, horarios))


def _contar(court_id: int) -> int:
    with SessionLocal() as db:
        return db.execute(
            select(func.count()).select_from(Reservation).where(
                Reservation.court_id == court_id
            )
        ).scalar_one()


def test_mismo_turno_una_sola_reserva(datos):
    """Muchos usuarios piden el MISMO turno a la vez: solo uno puede ganar."""
    user_id, court_id = datos
    turno = _base()

    resultados = _lanzar(user_id, court_id, [turno] * HILOS)

    assert resultados.count("creada") == 1
    assert resultados.count("rechazada") == HILOS - 1
    assert _contar(court_id) == 1  # y en la base de datos hay una sola fila


def test_turnos_distintos_todas_se_crean(datos):
    """Turnos distintos no se bloquean entre si: todas deben crearse."""
    user_id, court_id = datos
    base = _base()
    horarios = [base + timedelta(hours=i) for i in range(HILOS)]

    resultados = _lanzar(user_id, court_id, horarios)

    assert resultados.count("creada") == HILOS
    assert _contar(court_id) == HILOS


def test_cancha_inexistente():
    with SessionLocal() as db:
        with pytest.raises(CourtNotFoundError):
            create_reservation(db, 1, 999_999_999, _base())
