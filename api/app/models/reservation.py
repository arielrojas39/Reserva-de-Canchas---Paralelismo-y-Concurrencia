from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
DateTime,
Enum,
ForeignKey,
Index,
Integer,
Numeric,
func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base

class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    court_id: Mapped[int] = mapped_column(
        ForeignKey("courts.id"),
        nullable=False,
        index=True,
    )

    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    total_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        Enum(
            "pending",
            "confirmed",
            "cancelled",
            name="reservation_status",
        ),
        default="pending",
        server_default="pending",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Índice único parcial: solo una reserva activa (pending/confirmed)
    # puede ocupar un horario de cancha. Las canceladas quedan libres.
    __table_args__ = (
        Index(
            "uq_reservations_active_court_start_time",
            "court_id",
            "start_time",
            unique=True,
            postgresql_where=status.in_(["pending", "confirmed"]),
        ),
    )
