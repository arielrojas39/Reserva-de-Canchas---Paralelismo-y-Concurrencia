from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base

class Court(Base):
    __tablename__ = "courts"


    id: Mapped[int] = mapped_column(
    Integer,
    primary_key=True,
    index=True,
    )

    name: Mapped[str] = mapped_column(
    String(100),
    nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
    Text,
    nullable=True,
    )

    price_per_hour: Mapped[Decimal] = mapped_column(
    Numeric(10, 2),
    nullable=False,
    )

    players_per_team: Mapped[int] = mapped_column(
    Integer,
    nullable=False,
    )

    location: Mapped[str] = mapped_column(
    String(255),
    nullable=False,
    )

    surface_type: Mapped[str] = mapped_column(
    Enum(
        "synthetic",
        "grass",
        "concrete",
        name="court_surface_type",
    ),
    nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
    Boolean,
    default=True,
    server_default="true",
    nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    server_default=func.now(),
    nullable=False,
    )

