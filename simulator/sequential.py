"""Linea base: las reservas se hacen UNA TRAS OTRA."""
import time

from simulator.common import leer_argumentos, nuevo_base, reservar, reportar

if __name__ == "__main__":
    mismo, n = leer_argumentos()
    base = nuevo_base()

    inicio = time.perf_counter()
    resultados = [reservar((i, base, mismo)) for i in range(n)]
    reportar("SECUENCIAL", inicio, resultados, mismo)
