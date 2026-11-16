"""Linea base: las reservas se hacen UNA TRAS OTRA."""
from simulator.common import correr, reservar

if __name__ == "__main__":
    correr("SECUENCIAL", lambda tareas: [reservar(t) for t in tareas])
