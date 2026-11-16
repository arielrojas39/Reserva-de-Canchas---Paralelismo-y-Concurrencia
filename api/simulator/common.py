"""Utilidades compartidas por los tres modos del simulador.

El simulador llama directo a create_reservation() (sin pasar por HTTP).
Crea su propio usuario y su propia cancha de prueba y los borra al terminar,
asi que no ensucia los datos de desarrollo.
"""
import random
import sys
import time
import uuid
from datetime import date, time as dtime, timedelta

from fastapi import HTTPException
from sqlalchemy import delete

from app.db.database import SessionLocal
from app.models.court import Court
from app.models.reservation import Reservation
from app.models.user import User
from app.services.reservation_service import create_reservation

N_DEFAULT = 100
LATENCIA_DEFAULT = 0.2  # segundos
TURNOS_POR_DIA = 15  # horario comercial: 09:00 a 00:00 -> ultimo turno 23:00


def leer_argumentos() -> tuple[bool, int, float]:
    """--distintos     : cada reserva usa un turno diferente (por defecto todas
                         compiten por el MISMO turno).
       --n 200         : cantidad de reservas (por defecto 100).
       --latencia 0.5  : espera simulada tras reservar, en segundos (por defecto
                         0.2). Representa la llamada a Mercado Pago para crear
                         la preferencia de pago. Usar 0 para desactivarla."""
    mismo_horario = "--distintos" not in sys.argv
    n = N_DEFAULT
    latencia = LATENCIA_DEFAULT
    if "--n" in sys.argv:
        n = int(sys.argv[sys.argv.index("--n") + 1])
    if "--latencia" in sys.argv:
        latencia = float(sys.argv[sys.argv.index("--latencia") + 1])
    return mismo_horario, n, latencia


def preparar_datos() -> tuple[int, int]:
    """Crea un usuario y una cancha de prueba. Devuelve (user_id, court_id)."""
    with SessionLocal() as db:
        user = User(
            name="Simulador",
            email=f"sim-{uuid.uuid4().hex}@test.com",
            hashed_password="no-importa",
        )
        court = Court(
            name=f"Cancha simulador {uuid.uuid4().hex[:8]}",
            price_per_hour=1000,
            players_per_team=5,
            location="Simulador",
            surface_type="synthetic",
        )
        db.add_all([user, court])
        db.commit()
        return user.id, court.id


def limpiar_datos(user_id: int, court_id: int) -> None:
    with SessionLocal() as db:
        db.execute(delete(Reservation).where(Reservation.court_id == court_id))
        db.execute(delete(Court).where(Court.id == court_id))
        db.execute(delete(User).where(User.id == user_id))
        db.commit()


def construir_tareas(
    n: int, mismo_horario: bool, latencia: float, user_id: int, court_id: int
) -> list[tuple]:
    # Fecha futura aleatoria para no chocar con otras reservas
    base = date.today() + timedelta(days=random.randint(30, 200_000))
    tareas = []
    for i in range(n):
        if mismo_horario:
            fecha, hora = base, dtime(10, 0)
        else:
            # 15 turnos por dia: se reparten en dias consecutivos
            fecha = base + timedelta(days=i // TURNOS_POR_DIA)
            hora = dtime(9 + i % TURNOS_POR_DIA, 0)
        tareas.append((user_id, court_id, fecha, hora, latencia))
    return tareas


def reservar(tarea: tuple) -> int:
    """Hace UNA reserva. Cada llamada usa su propia sesion de base de datos
    (las sesiones no se comparten entre hilos ni procesos)."""
    user_id, court_id, fecha, hora, latencia = tarea
    with SessionLocal() as db:
        try:
            create_reservation(db, user_id, court_id, fecha, hora)
        except HTTPException as e:
            return e.status_code  # 409 = turno ocupado, 404 = no existe, etc.
        except Exception as e:
            print(f"Error inesperado: {type(e).__name__}: {e}")
            return 500

    # La sesion ya se cerro: la espera no retiene una conexion de la base.
    if latencia:
        time.sleep(latencia)  # simula crear la preferencia en Mercado Pago
    return 201


def reportar(
    nombre: str, inicio: float, resultados: list[int], mismo_horario: bool, latencia: float
) -> None:
    ok = resultados.count(201)
    conflicto = resultados.count(409)
    print(f"\n[{nombre}] {'MISMO horario' if mismo_horario else 'horarios DISTINTOS'}")
    print(f"  Peticiones        : {len(resultados)}")
    print(f"  Latencia simulada : {latencia}s por reserva exitosa")
    print(f"  Tiempo total      : {time.perf_counter() - inicio:.2f}s")
    print(f"  Creadas (201)     : {ok}")
    print(f"  Rechazadas (409)  : {conflicto}")
    print(f"  Otros (errores)   : {len(resultados) - ok - conflicto}")
    if mismo_horario:
        print(f"  Dobles reservas   : {max(ok - 1, 0)}  (tiene que ser 0)")


def correr(nombre: str, ejecutor) -> None:
    """Prepara los datos, ejecuta las reservas con `ejecutor` y limpia."""
    mismo, n, latencia = leer_argumentos()
    user_id, court_id = preparar_datos()
    try:
        tareas = construir_tareas(n, mismo, latencia, user_id, court_id)
        inicio = time.perf_counter()
        resultados = ejecutor(tareas)
        reportar(nombre, inicio, resultados, mismo, latencia)
    finally:
        limpiar_datos(user_id, court_id)
