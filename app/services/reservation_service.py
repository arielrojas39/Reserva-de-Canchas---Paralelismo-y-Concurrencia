from datetime import datetime, timezone
import time
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.court import Court
from app.models.reservation import Reservation


class CourtNotFoundError(Exception):
    pass


class SlotAlreadyTakenError(Exception):
    pass


def _slot_key(court_id: int, start_time: datetime) -> str:
    """Identifica un turno (cancha + horario) de forma unica."""
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    return f"{court_id}:{start_time.astimezone(timezone.utc).isoformat()}"


def create_reservation(
    db: Session, user_id: int, court_id: int, start_time: datetime
) -> Reservation:
    """Crea una reserva sin permitir dobles reservas, incluso con muchas
    peticiones simultaneas (hilos, procesos o varios workers del servidor)."""

    # 1) Bloqueo a nivel de TURNO (advisory lock de PostgreSQL).
    #    Quien pida el mismo turno espera su orden; turnos distintos NO se
    #    bloquean entre si. El lock se libera solo en commit/rollback.
    db.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:k, 0))"),
        {"k": _slot_key(court_id, start_time)},
    )

    court = db.execute(
        select(Court).where(Court.id == court_id)
    ).scalar_one_or_none()
    if court is None:
        db.rollback()
        raise CourtNotFoundError()
    
    # 2) Con el lock tomado, verificamos que el turno siga libre.
    taken = db.execute(
        select(Reservation.id).where(
            Reservation.court_id == court_id,
            Reservation.start_time == start_time,
            Reservation.status != "cancelled",
        )
    ).first()
    if taken:
        db.rollback()
        raise SlotAlreadyTakenError()
    time.sleep(0.2)  # simula la espera del servicio de pago
    reservation = Reservation(
        user_id=user_id,
        court_id=court_id,
        start_time=start_time,
        total_price=court.price_per_hour,
    )
    db.add(reservation)


    # 3) Ultima defensa: la constraint unica de la base de datos.
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise SlotAlreadyTakenError()

    db.refresh(reservation)
    return reservation
