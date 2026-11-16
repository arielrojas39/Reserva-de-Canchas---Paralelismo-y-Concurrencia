"""Concurrencia: muchas reservas en progreso a la vez usando HILOS."""
import time
from concurrent.futures import ThreadPoolExecutor

from simulator.common import leer_argumentos, nuevo_base, reservar, reportar

# Mantener por debajo de pool_size + max_overflow de database.py (20 + 20)
MAX_HILOS = 30

if __name__ == "__main__":
    mismo, n = leer_argumentos()
    base = nuevo_base()

    inicio = time.perf_counter()
    with ThreadPoolExecutor(max_workers=MAX_HILOS) as pool:
        resultados = list(pool.map(reservar, [(i, base, mismo) for i in range(n)]))
    reportar(f"CONCURRENTE ({MAX_HILOS} hilos)", inicio, resultados, mismo)
