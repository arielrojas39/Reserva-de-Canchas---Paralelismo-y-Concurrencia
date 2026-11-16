"""Verificación de flujo de reservas contra la base de datos local.

Registra un usuario, inicia sesión, crea una reserva, la lista, la cancela y
valida que un segundo intento sobre el mismo horario activo devuelva 409.
Limpia los datos de prueba al finalizar.

Requiere que PostgreSQL esté corriendo y configurado en el archivo `.env`.

Ejemplo de uso:

    python -m scripts.verify_reservation_flow
"""
from datetime import date, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.database import SessionLocal, get_db
from app.main import app
from app.models.court import Court
from app.models.reservation import Reservation
from app.models.user import User


app.dependency_overrides[get_db] = lambda: next(_local_db())


def _local_db():
    """Dependencia que expone una sesión real de PostgreSQL."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def main() -> None:
    client = TestClient(app)

    # Datos de prueba.
    email = f"test_{uuid4().hex[:8]}@example.com"
    password = "TestPass1234"
    name = "Usuario de prueba"
    test_date = date.today() + timedelta(days=7)
    test_time = "10:00:00"

    cleanup_user_id: int | None = None
    cleanup_reservation_ids: list[int] = []

    db = SessionLocal()
    try:
        # Buscamos una cancha existente (creada por seed).
        court = db.query(Court).filter(Court.is_active.is_(True)).first()
        if court is None:
            raise RuntimeError(
                "No hay canchas activas en la base de datos. "
                "Ejecutá primero: python -m scripts.seed"
            )

        # 1. Registrar usuario.
        register_response = client.post(
            "/auth/register",
            json={"name": name, "email": email, "password": password},
        )
        assert register_response.status_code == 201, register_response.text
        user = register_response.json()
        cleanup_user_id = user["id"]
        print(f"Usuario registrado: id={user['id']} email={email}")

        # 2. Iniciar sesión.
        login_response = client.post(
            "/auth/login",
            json={"email": email, "password": password},
        )
        assert login_response.status_code == 200, login_response.text
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login exitoso")

        # 3. Crear reserva.
        create_response = client.post(
            "/reservations",
            json={
                "court_id": court.id,
                "date": test_date.isoformat(),
                "time": test_time,
            },
            headers=headers,
        )
        assert create_response.status_code == 201, create_response.text
        reservation = create_response.json()
        cleanup_reservation_ids.append(reservation["id"])
        print(f"Reserva creada: id={reservation['id']} status={reservation['status']}")
        assert reservation["court_name"] == court.name
        assert reservation["status"] == "pending"

        # 4. Listar reservas del usuario.
        list_response = client.get("/reservations/me", headers=headers)
        assert list_response.status_code == 200, list_response.text
        reservations = list_response.json()
        print(f"Reservas del usuario: {len(reservations)}")
        assert any(r["id"] == reservation["id"] for r in reservations)

        # 5. Consultar reserva individual.
        detail_response = client.get(
            f"/reservations/{reservation['id']}",
            headers=headers,
        )
        assert detail_response.status_code == 200, detail_response.text
        print(f"Detalle de reserva: {detail_response.json()['id']}")

        # 6. Cancelar reserva.
        cancel_response = client.post(
            f"/reservations/{reservation['id']}/cancel",
            headers=headers,
        )
        assert cancel_response.status_code == 200, cancel_response.text
        cancelled = cancel_response.json()
        print(f"Reserva cancelada: status={cancelled['status']}")
        assert cancelled["status"] == "cancelled"

        # 7. Cancelar nuevamente debe devolver 409.
        double_cancel = client.post(
            f"/reservations/{reservation['id']}/cancel",
            headers=headers,
        )
        assert double_cancel.status_code == 409, double_cancel.text
        print("Reintento de cancelación devolvió 409: OK")

        # 8. Reutilizar el horario cancelado debe funcionar.
        recreate_response = client.post(
            "/reservations",
            json={
                "court_id": court.id,
                "date": test_date.isoformat(),
                "time": test_time,
            },
            headers=headers,
        )
        assert recreate_response.status_code == 201, recreate_response.text
        cleanup_reservation_ids.append(recreate_response.json()["id"])
        print("Horario cancelado reutilizado: OK")

        # 9. Reservar el mismo horario activo debe devolver 409.
        conflict_response = client.post(
            "/reservations",
            json={
                "court_id": court.id,
                "date": test_date.isoformat(),
                "time": test_time,
            },
            headers=headers,
        )
        assert conflict_response.status_code == 409, conflict_response.text
        print("Conflicto de horario activo devolvió 409: OK")

        print("\nFlujo de reservas verificado correctamente.")

    finally:
        # Limpieza de datos de prueba.
        deleted_reservations = (
            db.query(Reservation)
            .filter(Reservation.id.in_(cleanup_reservation_ids))
            .delete(synchronize_session=False)
        )
        if cleanup_user_id is not None:
            db.query(User).filter(User.id == cleanup_user_id).delete(
                synchronize_session=False
            )
        db.commit()
        print(
            f"Limpieza completada: "
            f"{deleted_reservations} reserva(s) y 1 usuario eliminados."
        )
        db.close()


if __name__ == "__main__":
    main()
