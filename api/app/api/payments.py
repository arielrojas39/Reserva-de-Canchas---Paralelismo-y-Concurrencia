from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import (
    PaymentStatusResponse,
    PreferenceCreate,
    PreferenceResponse,
)
from app.services.payment_service import (
    create_preference,
    get_payment_status,
    process_payment_webhook,
    validate_webhook_signature,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "/preferences",
    response_model=PreferenceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment_preference(
    data: PreferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment, checkout_url, init_point, sandbox_init_point = create_preference(
        db,
        current_user,
        data.reservation_id,
    )
    return PreferenceResponse(
        reservation_id=payment.reservation_id,
        preference_id=payment.preference_id or "",
        checkout_url=checkout_url,
        init_point=init_point,
        sandbox_init_point=sandbox_init_point,
    )


@router.post("/webhook")
async def mercado_pago_webhook(
    request: Request,
    data_id: str | None = Query(default=None, alias="data.id"),
    legacy_id: str | None = Query(default=None, alias="id"),
    topic: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """Notificación de Mercado Pago.

    Se valida la firma, se consulta el pago real y se actualiza la reserva.
    Siempre se responde 200 cuando la notificación es válida o ignorable para
    evitar reintentos innecesarios; los errores de infraestructura devuelven 5xx
    para que Mercado Pago reintente.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    event_type = str(body.get("type") or body.get("topic") or topic or "")
    payload_data = body.get("data") if isinstance(body.get("data"), dict) else {}
    payment_id = (
        data_id
        or legacy_id
        or (str(payload_data.get("id")) if payload_data.get("id") else None)
    )

    if event_type != "payment":
        return {"status": "ignored", "reason": f"evento {event_type or 'desconocido'}"}

    if not payment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notificación de pago sin data.id",
        )

    validate_webhook_signature(
        x_signature=request.headers.get("x-signature"),
        x_request_id=request.headers.get("x-request-id"),
        data_id=payment_id,
    )

    process_payment_webhook(db, payment_id)
    return {"status": "ok"}


@router.get(
    "/reservations/{reservation_id}",
    response_model=PaymentStatusResponse,
)
def get_reservation_payment(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment: Payment = get_payment_status(db, current_user, reservation_id)
    return PaymentStatusResponse.model_validate(payment)
