"""Concurrencia: muchas reservas en progreso a la vez usando HILOS."""
from concurrent.futures import ThreadPoolExecutor

from simulator.common import correr, reservar

# Mantener por debajo de pool_size + max_overflow de database.py (20 + 20)
MAX_HILOS = 30


def ejecutar(tareas):
    with ThreadPoolExecutor(max_workers=MAX_HILOS) as pool:
        return list(pool.map(reservar, tareas))


if __name__ == "__main__":
    correr(f"CONCURRENTE ({MAX_HILOS} hilos)", ejecutar)
