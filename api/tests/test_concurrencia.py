"""Pruebas de concurrencia sobre create_reservation().

Requieren PostgreSQL (usan la base configurada en .env). Ejecutar desde api/:
    python -m pytest tests/test_concurrencia.py -v

Cada test crea su propio usuario y su propia cancha, y los borra al terminar.
"""
import random
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import date, time, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy import delete, func, select

from app.db.database import SessionLocal, engine
from app.models.court import Court
from app.models.reservation import Reservation
from app.models.user import User
from app.services.reservation_service import create_reservation

pytestmark = pytest.mark.skipif(
    engine.dialect.name != "postgresql",
    reason="Las pruebas de concurrencia requieren PostgreSQL",
)

# Debe ser menor que pool_size + max_overflow de database.py (20 + 20)
HILOS = 30
TURNOS_POR_DIA = 15  # horario comercial: 09:00 a 00:00


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


def _fecha_base() -> date:
    return date.today() + timedelta(days=random.randint(30, 200_000))


def _lanzar(user_id: int, court_id: int, turnos: list[tuple[date, time]]) -> list[int]:
    """Lanza una reserva por turno, todas a la vez (una por hilo).
    Devuelve el codigo HTTP equivalente de cada una (201, 409, ...)."""
    barrera = threading.Barrier(len(turnos))

    def tarea(turno: tuple[date, time]) -> int:
        fecha, hora = turno
        barrera.wait()  # todos los hilos arrancan en el mismo instante
        with SessionLocal() as db:
            try:
                create_reservation(db, user_id, court_id, fecha, hora)
                return 201
            except HTTPException as e:
                return e.status_code

    with ThreadPoolExecutor(max_workers=len(turnos)) as pool:
        return list(pool.map(tarea, turnos))


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
    turno = (_fecha_base(), time(10, 0))

    resultados = _lanzar(user_id, court_id, [turno] * HILOS)

    assert resultados.count(201) == 1
    assert resultados.count(409) == HILOS - 1
    assert _contar(court_id) == 1  # y en la base de datos hay una sola fila


def test_turnos_distintos_todas_se_crean(datos):
    """Turnos distintos no se bloquean entre si: todas deben crearse."""
    user_id, court_id = datos
    base = _fecha_base()
    turnos = [
        (base + timedelta(days=i // TURNOS_POR_DIA), time(9 + i % TURNOS_POR_DIA, 0))
        for i in range(HILOS)
    ]

    resultados = _lanzar(user_id, court_id, turnos)

    assert resultados.count(201) == HILOS
    assert _contar(court_id) == HILOS


def test_cancha_inexistente(datos):
    user_id, _ = datos
    with SessionLocal() as db:
        with pytest.raises(HTTPException) as error:
            create_reservation(db, user_id, 999_999_999, _fecha_base(), time(10, 0))
    assert error.value.status_code == 404
