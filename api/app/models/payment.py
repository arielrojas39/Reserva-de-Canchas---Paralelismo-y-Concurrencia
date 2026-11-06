from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Payment(Base):
    """Intento de pago de una reserva mediante Mercado Pago Checkout Pro.

    Se crea una fila por preferencia. El webhook actualiza el estado con el
    pago real. No se modifica el modelo Reservation: el estado de la reserva
    sigue siendo la fuente de verdad para la disponibilidad.
    """

    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"),
        nullable=False,
        index=True,
    )

    external_reference: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        unique=True,
        index=True,
    )

    preference_id: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
        index=True,
    )

    payment_id: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
        unique=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pending",
        server_default="pending",
    )

    status_detail: Mapped[str | None] = mapped_column(String(120), nullable=True)

    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    currency_id: Mapped[str] = mapped_column(
        String(8),
        nullable=False,
        default="ARS",
        server_default="ARS",
    )

    init_point: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
