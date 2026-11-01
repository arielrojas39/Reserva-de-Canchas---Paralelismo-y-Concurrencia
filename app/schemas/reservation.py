from datetime import date
from pydantic import BaseModel

class AvailabilityResponse(BaseModel):
    court_id: int
    date: date
    available_times: list[str]