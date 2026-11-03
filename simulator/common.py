import random
import sys
import time
from datetime import datetime, timedelta, timezone

from app.db.database import SessionLocal
from app.services.reservation_service import (
    CourtNotFoundError,
    SlotAlreadyTakenError,
    create_reservation,
)

USER_ID = 1
COURT_ID = 1
N_DEFAULT = 100


def leer_argumentos() -> tuple[bool, int]:
    """--distintos : cada reserva usa un horario diferente (por defecto, todas
                     pelean por el MISMO horario).
       --n 200     : cantidad de reservas (por defecto 100)."""
    mismo_horario = "--distintos" not in sys.argv
    n = N_DEFAULT
    if "--n" in sys.argv:
        n = int(sys.argv[sys.argv.index("--n") + 1])
    return mismo_horario, n


def nuevo_base() -> datetime:
    # Fecha aleatoria para no chocar con reservas de corridas anteriores
    return datetime(2027, 1, 1, tzinfo=timezone.utc) + timedelta(
        days=random.randint(0, 1_000_000)
    )


def reservar(args) -> int:
    """Hace UNA reserva llamando directo al servicio. Cada llamada usa su
    propia sesion de base de datos (las sesiones no se comparten entre hilos)."""
    i, base, mismo_horario = args
    start = base if mismo_horario else base + timedelta(hours=i)
    with SessionLocal() as db:
        try:
            create_reservation(db, USER_ID, COURT_ID, start)
            return 201
        except SlotAlreadyTakenError:
            return 409
        except CourtNotFoundError:
            return 404
        except Exception as e:  # cualquier otro error se informa como 500
            print(f"Error inesperado: {type(e).__name__}: {e}")
            return 500


def reportar(nombre: str, inicio: float, resultados: list[int], mismo_horario: bool):
    ok = resultados.count(201)
    conflicto = resultados.count(409)
    print(f"\n[{nombre}] {'MISMO horario' if mismo_horario else 'horarios DISTINTOS'}")
    print(f"  Peticiones        : {len(resultados)}")
    print(f"  Tiempo total      : {time.perf_counter() - inicio:.2f}s")
    print(f"  Creadas (201)     : {ok}")
    print(f"  Rechazadas (409)  : {conflicto}")
    print(f"  Otros (errores)   : {len(resultados) - ok - conflicto}")
    if mismo_horario:
        print(f"  Dobles reservas   : {max(ok - 1, 0)}  (tiene que ser 0)")
