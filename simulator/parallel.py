"""Paralelismo: las reservas se reparten entre varios PROCESOS (varios nucleos)."""
import multiprocessing as mp
import time

from simulator.common import leer_argumentos, nuevo_base, reservar, reportar

if __name__ == "__main__":  # obligatorio en Windows
    mismo, n = leer_argumentos()
    base = nuevo_base()
    procesos = mp.cpu_count()

    inicio = time.perf_counter()
    with mp.Pool(processes=procesos) as pool:
        resultados = pool.map(reservar, [(i, base, mismo) for i in range(n)])
    reportar(f"PARALELO ({procesos} procesos)", inicio, resultados, mismo)
