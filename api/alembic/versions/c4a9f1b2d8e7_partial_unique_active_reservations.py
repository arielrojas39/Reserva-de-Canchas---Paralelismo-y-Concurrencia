"""partial unique active reservations

Revision ID: c4a9f1b2d8e7
Revises: 89bf348d7bad
Create Date: 2026-11-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4a9f1b2d8e7'
down_revision: Union[str, Sequence[str], None] = '89bf348d7bad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Eliminamos la unicidad global que impedía reutilizar horarios cancelados.
    op.drop_constraint(
        'uq_reservation_court_start_time',
        'reservations',
        type_='unique',
    )

    # Índice único parcial: solo reservas pending/confirmed ocupan un slot.
    # PostgreSQL ignora las filas canceladas al evaluar la unicidad.
    op.create_index(
        'uq_reservations_active_court_start_time',
        'reservations',
        ['court_id', 'start_time'],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'confirmed')"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        'uq_reservations_active_court_start_time',
        table_name='reservations',
    )

    op.create_unique_constraint(
        'uq_reservation_court_start_time',
        'reservations',
        ['court_id', 'start_time'],
    )
