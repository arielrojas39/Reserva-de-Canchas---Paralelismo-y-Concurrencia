"""Integración con Mercado Pago Checkout Pro.

El backend crea la preferencia y valida el webhook firmado. El frontend solo
redirige al `checkout_url`; nunca recibe el access token.
"""
import logging
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from uuid import uuid4

import mercadopago
from fastapi import HTTPException, status
from mercadopago.webhook import (
    InvalidWebhookSignatureError,
    WebhookSignatureValidator,
)
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.court import Court
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.models.user import User

logger = logging.getLogger(__name__)

_sdk: mercadopago.SDK | None = None


def get_mp_sdk() -> mercadopago.SDK:
    """Devuelve el SDK configurado o falla con un 503 explícito."""
    global _sdk
    if not settings.MP_ACCESS_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Mercado Pago no está configurado. Falta MP_ACCESS_TOKEN.",
        )
    if _sdk is None:
        _sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
    return _sdk


def _back_urls(reservation_id: int) -> dict[str, str]:
    base = settings.FRONTEND_URL.rstrip("/")
    return {
        "success": f"{base}/pago/retorno?pago=exito&reserva={reservation_id}",
        "failure": f"{base}/pago/retorno?pago=error&reserva={reservation_id}",
        "pending": f"{base}/pago/retorno?pago=pendiente&reserva={reservation_id}",
    }


def _checkout_url(response: dict) -> tuple[str | None, str | None, str]:
    init_point = response.get("init_point")
    sandbox_init_point = response.get("sandbox_init_point")
    # En sandbox se usa el checkout de prueba. El error 145 (“una de las
    # partes es de prueba”) ocurre si el comprador no es una cuenta test.
    if settings.MP_ENVIRONMENT == "sandbox" and sandbox_init_point:
        return sandbox_init_point, init_point, sandbox_init_point
    if init_point:
        return init_point, init_point, sandbox_init_point
    if sandbox_init_point:
        return sandbox_init_point, init_point, sandbox_init_point
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Mercado Pago no devolvió una URL de checkout.",
    )


def create_preference(
    db: Session,
    user: User,
    reservation_id: int,
) -> tuple[Payment, str, str | None, str | None]:
    """Crea una preferencia de Checkout Pro para una reserva pendiente."""
    reservation = db.get(Reservation, reservation_id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada",
        )

    role = getattr(user.role, "value", user.role)
    if reservation.user_id != user.id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenés permisos para pagar esta reserva",
        )

    if reservation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"La reserva está en estado {reservation.status} y no se puede pagar",
        )

    approved = (
        db.query(Payment)
        .filter(
            Payment.reservation_id == reservation_id,
            Payment.status == "approved",
        )
        .first()
    )
    if approved is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La reserva ya tiene un pago aprobado",
        )

    court = db.get(Court, reservation.court_id)
    if court is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cancha no encontrada",
        )

    external_reference = f"res-{reservation.id}-{uuid4().hex[:12]}"
    amount = Decimal(reservation.total_price)

    preference = {
        "items": [
            {
                "id": str(court.id),
                "title": f"Reserva {court.name}",
                "description": (
                    f"{reservation.start_time.strftime('%Y-%m-%d')} "
                    f"{reservation.start_time.strftime('%H:%M')} hs"
                ),
                "category_id": "services",
                "quantity": 1,
                "currency_id": "ARS",
                "unit_price": float(amount),
            }
        ],
        "external_reference": external_reference,
        "back_urls": _back_urls(reservation.id),
        "binary_mode": True,
        "statement_descriptor": settings.MP_STATEMENT_DESCRIPTOR[:22],
        "metadata": {
            "reservation_id": str(reservation.id),
            "user_id": str(user.id),
        },
    }

    # Mercado Pago exige HTTPS para auto_return. En local con HTTP se omite
    # para no bloquear la creación de la preferencia.
    if settings.FRONTEND_URL.startswith("https://"):
        preference["auto_return"] = "approved"

    if settings.MP_WEBHOOK_URL:
        preference["notification_url"] = settings.MP_WEBHOOK_URL

    result = get_mp_sdk().preference().create(preference)
    response = result.get("response") or {}
    if result.get("status") not in (200, 201) or not response.get("id"):
        logger.error("Mercado Pago rechazó la preferencia: %s", result)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo crear la preferencia de pago.",
        )

    checkout_url, init_point, sandbox_init_point = _checkout_url(response)

    payment = Payment(
        reservation_id=reservation.id,
        external_reference=external_reference,
        preference_id=str(response["id"]),
        status="pending",
        amount=amount,
        currency_id="ARS",
        init_point=checkout_url,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment, checkout_url, init_point, sandbox_init_point


def validate_webhook_signature(
    x_signature: str | None,
    x_request_id: str | None,
    data_id: str | None,
) -> None:
    """Valida la firma HMAC del webhook de Mercado Pago."""
    secret = settings.MP_WEBHOOK_SECRET
    if not secret:
        if settings.MP_ENVIRONMENT == "production":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Falta MP_WEBHOOK_SECRET en producción.",
            )
        logger.warning(
            "Webhook sin MP_WEBHOOK_SECRET: se acepta solo en entorno %s.",
            settings.MP_ENVIRONMENT,
        )
        return

    try:
        WebhookSignatureValidator.validate(
            x_signature=x_signature,
            x_request_id=x_request_id,
            data_id=data_id,
            secret=secret,
            tolerance_seconds=300,
        )
    except InvalidWebhookSignatureError as error:
        logger.warning("Webhook con firma inválida: %s", error)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firma de webhook inválida",
        )


def _mp_amount(value: object) -> Decimal | None:
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        return None


def process_payment_webhook(db: Session, mp_payment_id: str) -> Payment | None:
    """Consulta el pago real en Mercado Pago y actualiza reserva/payment."""
    result = get_mp_sdk().payment().get(mp_payment_id)
    if result.get("status") == 404:
        logger.info("Pago %s no encontrado en Mercado Pago", mp_payment_id)
        return None
    if result.get("status") not in (200, 201):
        logger.error("Error consultando pago %s: %s", mp_payment_id, result)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo consultar el pago en Mercado Pago.",
        )

    data = result.get("response") or {}
    external_reference = data.get("external_reference")
    if not external_reference:
        logger.warning("Pago %s sin external_reference", mp_payment_id)
        return None

    payment = (
        db.query(Payment)
        .filter(Payment.external_reference == str(external_reference))
        .first()
    )
    if payment is None:
        logger.warning(
            "Pago %s con external_reference desconocido: %s",
            mp_payment_id,
            external_reference,
        )
        return None

    reservation = db.get(Reservation, payment.reservation_id)
    if reservation is None:
        logger.error(
            "Pago %s apunta a una reserva inexistente %s",
            mp_payment_id,
            payment.reservation_id,
        )
        return None

    mp_status = str(data.get("status") or "unknown")
    payment.payment_id = str(data.get("id") or mp_payment_id)
    payment.status = mp_status
    payment.status_detail = data.get("status_detail")
    payment.updated_at = datetime.now(timezone.utc)

    # Verificación de integridad: monto y moneda deben coincidir con la reserva.
    paid_amount = _mp_amount(data.get("transaction_amount"))
    expected_amount = Decimal(reservation.total_price).quantize(Decimal("0.01"))
    currency = str(data.get("currency_id") or "ARS").upper()

    if paid_amount is not None and paid_amount != expected_amount:
        payment.status = "amount_mismatch"
        payment.status_detail = (
            f"Monto recibido {paid_amount} distinto de {expected_amount}"
        )
        logger.error(
            "Pago %s con monto incorrecto: %s != %s",
            mp_payment_id,
            paid_amount,
            expected_amount,
        )
    elif currency != "ARS":
        payment.status = "currency_mismatch"
        payment.status_detail = f"Moneda recibida {currency}"
        logger.error("Pago %s con moneda incorrecta: %s", mp_payment_id, currency)
    elif mp_status == "approved":
        reservation.status = "confirmed"
    elif mp_status in ("refunded", "charged_back"):
        # Un reembolso libera el horario y deja la reserva cancelada.
        if reservation.status in ("pending", "confirmed"):
            reservation.status = "cancelled"

    db.commit()
    db.refresh(payment)
    return payment


def get_payment_status(
    db: Session,
    user: User,
    reservation_id: int,
) -> Payment:
    reservation = db.get(Reservation, reservation_id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada",
        )

    role = getattr(user.role, "value", user.role)
    if reservation.user_id != user.id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenés permisos para ver el pago de esta reserva",
        )

    payment = (
        db.query(Payment)
        .filter(Payment.reservation_id == reservation_id)
        .order_by(Payment.created_at.desc(), Payment.id.desc())
        .first()
    )
    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La reserva todavía no tiene intentos de pago",
        )
    return payment
