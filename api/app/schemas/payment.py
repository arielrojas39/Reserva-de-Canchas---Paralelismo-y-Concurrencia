from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PreferenceCreate(BaseModel):
    reservation_id: int


class PreferenceResponse(BaseModel):
    reservation_id: int
    preference_id: str
    checkout_url: str
    init_point: str | None = None
    sandbox_init_point: str | None = None


class PaymentStatusResponse(BaseModel):
    reservation_id: int
    status: str
    status_detail: str | None = None
    payment_id: str | None = None
    amount: Decimal
    currency_id: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
