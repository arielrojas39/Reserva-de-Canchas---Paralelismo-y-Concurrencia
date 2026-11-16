# date: representa el día consultado.
# datetime y time: permiten construir los horarios de apertura y cierre.
# timedelta: permite avanzar al día siguiente y calcular la duración de los turnos.
# ZoneInfo: permite trabajar con la zona horaria argentina.
# Session: permite consultar PostgreSQL.
# Court y Reservation: son los modelos que necesitamos consultar.

from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.court import Court
from app.models.reservation import Reservation
from fastapi import HTTPException, status


# Zona horaria de Argentina
ARGENTINA_TZ = ZoneInfo("America/Argentina/Buenos_Aires")


# Recibe una fecha y devuelve 2 objetos de estructura datetime con la fecha y hora de apertura y cierre respectivamente
# Estos valores no serviran para filtrar los horarios ocupados de la cancha
def get_business_hours(selected_date: date):

    # Horario de apertura: 09:00
    opening_time = time(9, 0)

    # Horario de cierre: 00:00 del día siguiente
    closing_time = time(0, 0)

    # Combina la fecha seleccionada con el horario de apertura
    opening = datetime.combine(
        selected_date,
        opening_time,
        tzinfo=ARGENTINA_TZ
    )

    # Calcula la fecha del día siguiente.
    closing_date = selected_date + timedelta(days=1)

    # Combina la fecha siguiente con el horario de cierre.
    closing = datetime.combine(
        closing_date,
        closing_time,
        tzinfo=ARGENTINA_TZ
    )

    return opening, closing


# Funcion para consultar los horarios ocupados de una cancha

# Recibe una sesion de base de datos, el id de la cancha, y los horarios de apertura y cierre
# -> set[datetime]: devuelve un conjunto de objetos datetime que representan los horarios ocupados de la cancha
def get_occupied_times(
    db: Session,
    court_id: int,
    opening: datetime,
    closing: datetime
) -> set[datetime]:

    reservations = (
        # Consulta SQLAlchemy para obtener los horarios de inicio de las reservas de la cancha
        # 1. Filtra por el id de la cancha
        # 2. Filtra por los horarios de inicio que esten entre la apertura y el cierre
        # 3. Filtra por el estado de la reserva, solo se consideran las reservas pendientes o confirmadas
        db.query(Reservation.start_time)
        .filter(
            Reservation.court_id == court_id,
            Reservation.start_time >= opening,
            Reservation.start_time < closing,
            # El estado cancel no se considera porque de ser el caso la reserva 
            # seria anulada y el horario estaria disponible para reservar
            Reservation.status.in_(["pending", "confirmed"])
        )
        .all()
    )

    # Devuelve un conjunto de objetos datetime que representan los horarios ocupados de la cancha    
    return {reservation.start_time for reservation in reservations}

# Funcion para calcular los horarios disponibles de una cancha
# Recibe:
# - opening: horario de apertura.
# - closing: horario de cierre.
# - occupied_times: conjunto de horarios ocupados.
# -> list[str] Devuelve una lista de strings con los horarios disponibles.
def calculate_available_times(
    opening: datetime,
    closing: datetime,
    occupied_times: set[datetime]
) -> list[str]:

    # Inicializamos una lista vacia para almacenar los horarios disponibles
    available_times = []

    # Obtiene la fecha y hora actual de Argentina
    current_time = datetime.now(ARGENTINA_TZ)

    # Comienza el recorrido desde el horario de apertura
    slot = opening

    # Mientras el turno completo no supere el horario de cierre
    while slot + timedelta(hours=1) <= closing:

        # Comprueba que el horario no haya pasado y que esté libre
        if slot > current_time and slot not in occupied_times:

            # Convierte el horario a texto con formato HH:MM
            available_times.append(slot.strftime("%H:%M"))

        # Avanza una hora para evaluar el siguiente turno
        slot += timedelta(hours=1)

    # Devuelve la lista de horarios disponibles
    return available_times

# Funcion principal para obtener la disponibilidad de una cancha en una fecha especifica
# Recibe una sesion de base de datos, el id de la cancha y la fecha seleccionada
# -> dict: devuelve un diccionario con el id de la cancha, la fecha seleccionada y una lista de los horarios disponibles para reservar en esa fecha
def get_court_availability(
    db: Session,
    court_id: int,
    selected_date: date
) -> dict:

    # 1. Buscar la cancha en PostgreSQL
    court = db.query(Court).filter(Court.id == court_id).first()

    # 2. Verificar que la cancha exista
    if court is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cancha no encontrada"
        )

    # 3. Verificar que la cancha esté activa
    if not court.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La cancha no se encuentra disponible"
        )

    # 4. Obtener los horarios de funcionamiento
    opening, closing = get_business_hours(selected_date)

    # 5. Consultar los horarios ocupados
    occupied_times = get_occupied_times(
        db,
        court_id,
        opening,
        closing
    )

    # 6. Calcular los horarios disponibles
    available_times = calculate_available_times(
        opening,
        closing,
        occupied_times
    )

    # 7. Devolver el resultado
    return {
        "court_id": court_id,
        "date": selected_date,
        "available_times": available_times
    }

def create_reservation(
        db: Session,
        user_id: int,
        court_id: int,
        selected_date: date,
        selected_time: time
):
    #1.Combinar fecha y hora utilizando el horario argentino
    start_time = datetime.combine(
        selected_date,
        selected_time,
        tzinfo=ARGENTINA_TZ
    )

    #2. Comprobar que el horario este dentro del horario comercial
    opening, closing = get_business_hours(selected_date)

    if start_time < opening or start_time + timedelta(hours=1) > closing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El horario seleccionado no está dentro del horario comercial"
        )
    #3. Comprobar que el horario no haya pasado
    if start_time <= datetime.now(ARGENTINA_TZ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede realizar reservas para horarios pasados"
        )
    #4. Verificar que la cancha exista
    court =db.query(Court).filter(Court.id == court_id).first()
    if court is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cancha no encontrada"
        )

    #5. Verificar que la cancha este activa
    if not court.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La cancha no se encuentra disponible"
        )
    # Bloqueo por turno (advisory lock de PostgreSQL): las solicitudes por el
    # mismo turno se ordenan en fila; turnos distintos no se bloquean entre si.
    # Se libera solo al hacer commit o rollback. Se omite en SQLite (tests).
    if db.get_bind().dialect.name == "postgresql":
        slot_key = f"{court_id}:{start_time.astimezone(timezone.utc).isoformat()}"
        db.execute(
            text("SELECT pg_advisory_xact_lock(hashtextextended(:k, 0))"),
            {"k": slot_key},
        )
    #6. Verificar que el horario no se encuentre ocupado
    reservation_exists = (
        db.query(Reservation)
        .filter(
            Reservation.court_id == court_id,
            Reservation.start_time == start_time,
            Reservation.status.in_(["pending", "confirmed"])
        )
        .first()
    )
    if reservation_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El horario seleccionado ya se encuentra reservado"
        )
    #7. Obtener el precio de la cancha
    total_price = court.price_per_hour
    #8. Crear la reserva
    new_servation = Reservation(
        user_id=user_id,
        court_id=court_id,
        start_time=start_time,
        total_price=total_price,
        status="pending"
    )
    db.add(new_servation)
    try:
        db.commit()
        db.refresh(new_servation)
    except IntegrityError:
        # La carrera entre dos solicitudes simultáneas la resuelve el índice
        # único parcial de PostgreSQL. Otros errores de infraestructura deben
        # propagarse como 500, no simularse como conflicto de horario.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo completar la reserva. Es posible que el horario haya sido reservado recientemente"
        )
    return new_servation