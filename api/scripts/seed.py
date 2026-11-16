"""Seed local idempotente.

Carga canchas de ejemplo y, si están configuradas las variables de entorno
SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD y SEED_ADMIN_NAME, crea un usuario
administrador.

Ejemplo de uso:

    python -m scripts.seed

o:

    python scripts/seed.py
"""
from decimal import Decimal

from pydantic import EmailStr, TypeAdapter, ValidationError

from app.core.config import settings
from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.court import Court
from app.models.user import User


# Canchas de ejemplo para desarrollo local.
SAMPLE_COURTS = [
    {
        "name": "Cancha Sintética 1",
        "description": "Cancha de fútbol 5 con césped sintético",
        "price_per_hour": Decimal("15000.00"),
        "players_per_team": 5,
        "location": "Complejo deportivo",
        "surface_type": "synthetic",
    },
    {
        "name": "Cancha Sintética 2",
        "description": "Cancha de fútbol 5 con césped sintético",
        "price_per_hour": Decimal("18000.00"),
        "players_per_team": 5,
        "location": "Complejo deportivo",
        "surface_type": "synthetic",
    },
    {
        "name": "Cancha de Césped",
        "description": "Cancha de fútbol 7 con césped natural",
        "price_per_hour": Decimal("20000.00"),
        "players_per_team": 7,
        "location": "Complejo deportivo",
        "surface_type": "grass",
    },
    {
        "name": "Cancha de Cemento",
        "description": "Cancha de fútbol 5 con piso de cemento",
        "price_per_hour": Decimal("12000.00"),
        "players_per_team": 5,
        "location": "Complejo deportivo",
        "surface_type": "concrete",
    },
]


def seed_courts(db: SessionLocal) -> int:
    """Crea las canchas de ejemplo si no existen (por nombre)."""
    created = 0
    existing_names = {name for name, in db.query(Court.name).all()}

    for data in SAMPLE_COURTS:
        if data["name"] in existing_names:
            print(f"Cancha ya existe: {data['name']}")
            continue

        court = Court(**data)
        db.add(court)
        created += 1
        print(f"Creando cancha: {data['name']}")

    return created


def seed_admin(db: SessionLocal) -> int:
    """Crea el usuario admin si están completas las variables de entorno."""
    email = settings.SEED_ADMIN_EMAIL
    password = settings.SEED_ADMIN_PASSWORD
    name = settings.SEED_ADMIN_NAME

    if not all([email, password, name]):
        print(
            "SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD o SEED_ADMIN_NAME no "
            "están configuradas. Se omite la creación del administrador."
        )
        return 0

    # EmailStr rechaza dominios reservados como .local, que luego fallarían
    # también al iniciar sesión por la validación del schema UserLogin.
    try:
        email = TypeAdapter(EmailStr).validate_python(email)
    except ValidationError:
        print(
            f"SEED_ADMIN_EMAIL inválido ({email}). Usá un dominio de correo "
            "real, por ejemplo admin@canchasplay.com."
        )
        return 0

    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        print(f"Usuario admin ya existe: {email}")
        return 0

    admin = User(
        name=name,
        email=email,
        hashed_password=hash_password(password),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    print(f"Creando administrador: {email}")
    return 1


def main() -> None:
    db = SessionLocal()
    try:
        courts_created = seed_courts(db)
        admin_created = seed_admin(db)

        db.commit()

        print("\nSeed completado.")
        print(f"  Canchas creadas: {courts_created}")
        print(f"  Administradores creados: {admin_created}")
    except Exception as exc:
        db.rollback()
        print(f"Error durante el seed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
