"""Paralelismo: las reservas se reparten entre varios PROCESOS (varios nucleos)."""
import multiprocessing as mp

from simulator.common import correr, reservar

PROCESOS = mp.cpu_count()


def ejecutar(tareas):
    with mp.Pool(processes=PROCESOS) as pool:
        return pool.map(reservar, tareas)


if __name__ == "__main__":  # obligatorio en Windows
    correr(f"PARALELO ({PROCESOS} procesos)", ejecutar)
