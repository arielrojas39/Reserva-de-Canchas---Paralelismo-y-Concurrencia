from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.db.database import get_db
from app.models.court import Court
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.reservation import (
    AvailabilityResponse,
    ReservationCreate,
    ReservationResponse,
)
from app.services.reservation_service import (
    ARGENTINA_TZ,
    create_reservation,
    get_court_availability,
)

router = APIRouter(tags=["Reservations"])


def _user_role(user: User) -> str:
    """Normaliza el rol porque SQLAlchemy puede devolver un Enum o un string."""
    return getattr(user.role, "value", user.role)


def _build_reservation_response(
    reservation: Reservation,
    court: Court,
) -> dict:
    """Construye un diccionario compatible con ReservationResponse.

    Alinea la fecha/hora a America/Argentina/Buenos_Aires y agrega el
    nombre de la cancha para no depender de relaciones ORM complejas.
    """
    local_start = reservation.start_time.astimezone(ARGENTINA_TZ)

    return {
        "id": reservation.id,
        "court_id": reservation.court_id,
        "court_name": court.name,
        "user_id": reservation.user_id,
        "date": local_start.date(),
        "time": local_start.time(),
        "total_price": reservation.total_price,
        "status": reservation.status,
        "created_at": reservation.created_at,
    }


@router.get(
    "/courts/{court_id}/availability",
    response_model=AvailabilityResponse,
)
def get_court_availability_endpoint(
    court_id: int,
    selected_date: date = Query(alias="date"),
    db: Session = Depends(get_db),
):
    return get_court_availability(
        db,
        court_id,
        selected_date,
    )


@router.post(
    "/reservations",
    response_model=ReservationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reservation_endpoint(
    reservation_data: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_reservation = create_reservation(
        db,
        current_user.id,
        reservation_data.court_id,
        reservation_data.date,
        reservation_data.time,
    )

    court = db.get(Court, new_reservation.court_id)
    if court is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cancha no encontrada",
        )

    return _build_reservation_response(new_reservation, court)


@router.get(
    "/reservations/me",
    response_model=list[ReservationResponse],
)
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = db.execute(
        select(Reservation, Court)
        .join(Court, Reservation.court_id == Court.id)
        .where(Reservation.user_id == current_user.id)
        .order_by(Reservation.start_time.desc(), Reservation.created_at.desc())
    ).all()

    return [
        _build_reservation_response(reservation, court)
        for reservation, court in results
    ]


@router.get(
    "/reservations/{reservation_id}",
    response_model=ReservationResponse,
)
def get_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.execute(
        select(Reservation, Court)
        .join(Court, Reservation.court_id == Court.id)
        .where(Reservation.id == reservation_id)
    ).first()

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada",
        )

    reservation, court = result

    if reservation.user_id != current_user.id and _user_role(current_user) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenés permisos para ver esta reserva",
        )

    return _build_reservation_response(reservation, court)


@router.post(
    "/reservations/{reservation_id}/cancel",
    response_model=ReservationResponse,
)
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.execute(
        select(Reservation, Court)
        .join(Court, Reservation.court_id == Court.id)
        .where(Reservation.id == reservation_id)
    ).first()

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada",
        )

    reservation, court = result

    if reservation.user_id != current_user.id and _user_role(current_user) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenés permisos para cancelar esta reserva",
        )

    if reservation.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La reserva ya se encuentra cancelada",
        )

    if reservation.status not in ("pending", "confirmed"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"No se puede cancelar una reserva en estado {reservation.status}",
        )

    # No liberar un horario pagado sin reembolso: se evita perder el cobro.
    approved_payment = (
        db.query(Payment)
        .filter(
            Payment.reservation_id == reservation.id,
            Payment.status == "approved",
        )
        .first()
    )
    if approved_payment is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "La reserva tiene un pago aprobado. Gestioná el reembolso "
                "desde Mercado Pago antes de cancelarla."
            ),
        )

    reservation.status = "cancelled"
    db.commit()
    db.refresh(reservation)

    return _build_reservation_response(reservation, court)


@router.get(
    "/reservations",
    response_model=list[ReservationResponse],
)
def list_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    results = db.execute(
        select(Reservation, Court)
        .join(Court, Reservation.court_id == Court.id)
        .order_by(Reservation.start_time.desc(), Reservation.created_at.desc())
    ).all()

    return [
        _build_reservation_response(reservation, court)
        for reservation, court in results
    ]
