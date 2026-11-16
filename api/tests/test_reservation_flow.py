"""Flujo de reservas con TestClient y SQLite en memoria.

No requiere un servidor externo ni una base de datos PostgreSQL.
Se crean las tablas sobre una base SQLite volátil y se limpian al finalizar.
"""
import os
from datetime import date, timedelta

# Configuramos variables mínimas antes de importar la aplicación, de modo que
# los tests puedan ejecutarse aunque no exista un archivo .env.
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "60")
os.environ.setdefault("FRONTEND_ORIGINS", "http://localhost:3000")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool, text
from sqlalchemy.orm import sessionmaker

from app.db.database import Base, get_db
from app.main import app
from app.models.court import Court
from app.models.user import User
from app.models.payment import Payment
from app.core.security import hash_password
import app.services.payment_service as payment_service


# Motor SQLite compartido en memoria para todos los endpoints.
engine_test = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine_test,
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


client = TestClient(app)


def _create_admin_user(db):
    admin = User(
        name="Admin Seed",
        email="admin@example.com",
        hashed_password=hash_password("AdminPass123"),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    return admin


def _create_sample_court(db):
    court = Court(
        name="Cancha Test",
        description="Cancha de prueba",
        price_per_hour=15000.00,
        players_per_team=5,
        location="Test",
        surface_type="synthetic",
        is_active=True,
    )
    db.add(court)
    db.commit()
    db.refresh(court)
    return court


def _login(email: str, password: str) -> str:
    response = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_reservation_flow(monkeypatch):
    # Preparamos la base de datos de prueba.
    Base.metadata.create_all(bind=engine_test)

    # SQLite no soporta índices únicos parciales, por lo que SQLAlchemy crea
    # un índice único global que impediría reutilizar horarios cancelados.
    # Lo eliminamos en tests para que la lógica de negocio (y el índice de
    # PostgreSQL) controlen la unicidad real.
    if "sqlite" in engine_test.url.drivername:
        with engine_test.connect() as conn:
            conn.execute(
                text(
                    "DROP INDEX IF EXISTS "
                    "uq_reservations_active_court_start_time"
                )
            )
            conn.commit()

    db = TestingSessionLocal()
    try:
        _create_admin_user(db)
        court = _create_sample_court(db)
    finally:
        db.close()

    # 1. Registramos un usuario cliente.
    register_response = client.post(
        "/auth/register",
        json={
            "name": "Cliente Test",
            "email": "cliente@example.com",
            "password": "ClientePass123",
        },
    )
    assert register_response.status_code == 201, register_response.text
    user = register_response.json()
    assert user["role"] == "customer"

    token = _login("cliente@example.com", "ClientePass123")
    headers = {"Authorization": f"Bearer {token}"}

    # Fecha/hora futura para evitar el rechazo de horarios pasados.
    reservation_date = date.today() + timedelta(days=7)
    reservation_time = "10:00:00"

    # 2. Creamos una reserva.
    create_response = client.post(
        "/reservations",
        json={
            "court_id": court.id,
            "date": reservation_date.isoformat(),
            "time": reservation_time,
        },
        headers=headers,
    )
    assert create_response.status_code == 201, create_response.text
    created = create_response.json()
    assert created["court_id"] == court.id
    assert created["court_name"] == court.name
    assert created["user_id"] == user["id"]
    assert created["date"] == reservation_date.isoformat()
    assert created["time"] == reservation_time
    assert created["status"] == "pending"
    assert isinstance(created["total_price"], str)

    reservation_id = created["id"]

    # Reserva separada para probar el pago sin bloquear el flujo de cancelación.
    payment_response = client.post(
        "/reservations",
        json={
            "court_id": court.id,
            "date": reservation_date.isoformat(),
            "time": "11:00:00",
        },
        headers=headers,
    )
    assert payment_response.status_code == 201, payment_response.text
    payment_reservation_id = payment_response.json()["id"]

    # 2b. Pago con Mercado Pago (SDK falso, sin llamadas externas).
    class FakePreference:
        def create(self, data):
            assert data["external_reference"]
            assert data["items"][0]["unit_price"] == 15000.0
            return {
                "status": 201,
                "response": {
                    "id": "pref-test-1",
                    "init_point": "https://www.mercadopago.com.ar/checkout",
                    "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout",
                },
            }

    class FakePayment:
        def get(self, payment_id):
            db = TestingSessionLocal()
            try:
                pago = (
                    db.query(Payment)
                    .filter(Payment.reservation_id == payment_reservation_id)
                    .first()
                )
                external_reference = pago.external_reference
            finally:
                db.close()
            return {
                "status": 200,
                "response": {
                    "id": payment_id,
                    "external_reference": external_reference,
                    "status": "approved",
                    "status_detail": "accredited",
                    "transaction_amount": "15000.00",
                    "currency_id": "ARS",
                },
            }

    class FakeSDK:
        def preference(self):
            return FakePreference()

        def payment(self):
            return FakePayment()

    monkeypatch.setattr(payment_service, "get_mp_sdk", lambda: FakeSDK())

    pref_response = client.post(
        "/payments/preferences",
        json={"reservation_id": payment_reservation_id},
        headers=headers,
    )
    assert pref_response.status_code == 201, pref_response.text
    pref_data = pref_response.json()
    assert pref_data["preference_id"] == "pref-test-1"
    assert pref_data["checkout_url"].startswith("https://sandbox.mercadopago.com.ar")

    db = TestingSessionLocal()
    try:
        pago = db.query(Payment).filter(Payment.reservation_id == payment_reservation_id).first()
        assert pago is not None
        assert pago.status == "pending"
    finally:
        db.close()

    # El webhook consulta el pago real y confirma la reserva.
    webhook_response = client.post(
        "/payments/webhook?data.id=mp-test-1",
        json={"type": "payment", "data": {"id": "mp-test-1"}},
    )
    assert webhook_response.status_code == 200, webhook_response.text

    status_response = client.get(
        f"/payments/reservations/{payment_reservation_id}",
        headers=headers,
    )
    assert status_response.status_code == 200, status_response.text
    assert status_response.json()["status"] == "approved"

    confirmed_response = client.get(f"/reservations/{payment_reservation_id}", headers=headers)
    assert confirmed_response.status_code == 200, confirmed_response.text
    assert confirmed_response.json()["status"] == "confirmed"

    # Una reserva pagada no se puede cancelar sin reembolso.
    paid_cancel = client.post(
        f"/reservations/{payment_reservation_id}/cancel",
        headers=headers,
    )
    assert paid_cancel.status_code == 409, paid_cancel.text

    # 3. Listamos las reservas del usuario autenticado.
    list_response = client.get("/reservations/me", headers=headers)
    assert list_response.status_code == 200, list_response.text
    reservations = list_response.json()
    assert len(reservations) == 2
    assert {item["id"] for item in reservations} == {reservation_id, payment_reservation_id}

    # 4. Consultamos la reserva individual.
    detail_response = client.get(
        f"/reservations/{reservation_id}",
        headers=headers,
    )
    assert detail_response.status_code == 200, detail_response.text
    assert detail_response.json()["id"] == reservation_id

    # 5. Cancelamos la reserva.
    cancel_response = client.post(
        f"/reservations/{reservation_id}/cancel",
        headers=headers,
    )
    assert cancel_response.status_code == 200, cancel_response.text
    cancelled = cancel_response.json()
    assert cancelled["status"] == "cancelled"

    # 6. Cancelar nuevamente debe devolver 409.
    double_cancel_response = client.post(
        f"/reservations/{reservation_id}/cancel",
        headers=headers,
    )
    assert double_cancel_response.status_code == 409, double_cancel_response.text

    # 7. Volver a reservar el mismo horario cancelado debe funcionar.
    recreate_response = client.post(
        "/reservations",
        json={
            "court_id": court.id,
            "date": reservation_date.isoformat(),
            "time": reservation_time,
        },
        headers=headers,
    )
    assert recreate_response.status_code == 201, recreate_response.text

    # 8. Reservar dos veces el mismo horario activo debe devolver 409.
    conflict_response = client.post(
        "/reservations",
        json={
            "court_id": court.id,
            "date": reservation_date.isoformat(),
            "time": reservation_time,
        },
        headers=headers,
    )
    assert conflict_response.status_code == 409, conflict_response.text

    # 9. Un usuario sin token no puede crear reservas.
    unauthorized_response = client.post(
        "/reservations",
        json={
            "court_id": court.id,
            "date": reservation_date.isoformat(),
            "time": reservation_time,
        },
    )
    assert unauthorized_response.status_code == 401, unauthorized_response.text

    # Limpieza: la base SQLite en memoria se destruye al cerrar el proceso.
    Base.metadata.drop_all(bind=engine_test)
