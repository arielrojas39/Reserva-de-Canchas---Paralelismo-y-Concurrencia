from decimal import Decimal
from datetime import date, time, datetime
from pydantic import BaseModel, Field, field_validator

# Estructura de datos respuesta a consulta de horarios disponibles para una cancha en particular
class AvailabilityResponse(BaseModel):
    court_id: int
    date: date
    available_times: list[str]

# Estructura de datos para crear una reserva
class ReservationCreate(BaseModel):
    # El id de la cancha debe ser un entero positivo
    court_id: int = Field(gt=0)
    date: date
    time: time

    # Validacion para asegurar que el horario de inicio sea una hora en punto
    @field_validator("time")
    @classmethod
    def validate_start_time(cls, value: time):
        if value.minute != 0 or value.second != 0 or value.microsecond != 0:
            raise ValueError("El horario de inicio debe comenzar en una hora en punto")

        return value
    
# Esquema para respuesta de una reserva
class ReservationResponse(BaseModel):
    id: int
    court_id: int
    user_id: int
    court_name: str
    date: date
    time: time
    total_price: Decimal
    status: str
    created_at: datetime