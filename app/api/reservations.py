from datetime import date

# APIRouter: permite definir rutas y agruparlas para incluirlas en la aplicación principal.
# Depends: permite declarar dependencias de una ruta, como una sesión de base de datos.
# Query: permite configurar parámetros de consulta (query parameters).
from fastapi import APIRouter, Depends, Query

# Session: representa una sesión de conexión con la base de datos mediante SQLAlchemy.
from sqlalchemy.orm import Session

# get_db: proporciona una sesión de base de datos para atender la petición.
from app.db.database import get_db

# AvailabilityResponse: esquema Pydantic que define la estructura de la respuesta.
from app.schemas.reservation import AvailabilityResponse

# get_court_availability: función del servicio que contiene la lógica para consultar
# la disponibilidad de una cancha en una fecha determinada.
from app.services.reservation_service import get_court_availability


# Router para agrupar las rutas relacionadas con las reservas.
router = APIRouter(tags=["Reservations"])


# Consulta la disponibilidad de una cancha para una fecha específica.
@router.get(
    "/courts/{court_id}/availability",
    response_model=AvailabilityResponse
)
def get_court_availability_endpoint(
    court_id: int,
    selected_date: date = Query(alias="date"),
    db: Session = Depends(get_db)
):
    return get_court_availability(
        db,
        court_id,
        selected_date
    )