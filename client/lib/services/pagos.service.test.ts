import { beforeEach, describe, expect, it } from "vitest";
import { pagarReservaDemo } from "@/lib/services/pagos.service";
import { crearReservaDemo } from "@/lib/services/reservas.service";
import { CLAVES_DEMO } from "@/lib/services/demo.store";
import type { Reserva } from "@/types";
import { acelerarSimulacion } from "@/tests/helpers";

function guardarReserva(reserva: Reserva): void {
  window.localStorage.setItem(CLAVES_DEMO.reservas, JSON.stringify([reserva]));
}

function reservaBase(estado: Reserva["estado"], extras: Partial<Reserva> = {}): Reserva {
  return {
    id: "reserva-test",
    usuarioId: "usuario-1",
    canchaId: "cancha-1",
    horarioId: "horario-test",
    fecha: "2026-11-20",
    inicio: "19:00",
    fin: "20:00",
    montoTotal: 18000,
    estado,
    creadaEn: new Date().toISOString(),
    expiracion: new Date(Date.now() + 600_000).toISOString(),
    ...extras,
  };
}

describe("pagos.service (demo)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("confirma la reserva con pago aprobado (200)", async () => {
    acelerarSimulacion();
    guardarReserva(reservaBase("pendiente"));
    const respuesta = await pagarReservaDemo("reserva-test", "aprobado");
    expect(respuesta.codigo).toBe(200);
    expect(respuesta.reserva?.estado).toBe("confirmada");
  });

  it("cancela la reserva con pago rechazado (402)", async () => {
    acelerarSimulacion();
    guardarReserva(reservaBase("pendiente"));
    const respuesta = await pagarReservaDemo("reserva-test", "rechazado");
    expect(respuesta.codigo).toBe(402);
    expect(respuesta.reserva?.estado).toBe("cancelada");
  });

  it("el error simulado devuelve500 y la reserva vuelve a pendiente", async () => {
    acelerarSimulacion();
    guardarReserva(reservaBase("pendiente"));
    const respuesta = await pagarReservaDemo("reserva-test", "error");
    expect(respuesta.codigo).toBe(500);
    expect(respuesta.reserva?.estado).toBe("pendiente");
  });

  it("devuelve409 si la reserva ya está confirmada", async () => {
    acelerarSimulacion();
    guardarReserva(reservaBase("confirmada"));
    const respuesta = await pagarReservaDemo("reserva-test", "aprobado");
    expect(respuesta.codigo).toBe(409);
  });

  it("devuelve410 si la reserva está expirada o vencida", async () => {
    acelerarSimulacion();
    guardarReserva(reservaBase("expirada"));
    expect((await pagarReservaDemo("reserva-test", "aprobado")).codigo).toBe(410);

    guardarReserva(
      reservaBase("pendiente", {
        expiracion: new Date(Date.now() - 1000).toISOString(),
      }),
    );
    expect((await pagarReservaDemo("reserva-test", "aprobado")).codigo).toBe(410);
  });

  it("devuelve410 si la reserva no existe", async () => {
    acelerarSimulacion();
    const respuesta = await pagarReservaDemo("no-existe", "aprobado");
    expect(respuesta.codigo).toBe(410);
  });

  it("flujo completo: crear pendiente y pagarla", async () => {
    acelerarSimulacion();
    const creada = await crearReservaDemo({
      canchaId: "cancha-2",
      canchaNombre: "Complejo El Potrero",
      horarioId: "cancha-2-2026-11-21-20:00",
      fecha: "2026-11-21",
      inicio: "20:00",
      fin: "21:00",
      montoTotal: 26000,
      usuarioId: "usuario-2",
    });
    expect(creada.codigo).toBe(201);

    const pago = await pagarReservaDemo(creada.reserva!.id, "aprobado");
    expect(pago.codigo).toBe(200);
    expect(pago.reserva?.estado).toBe("confirmada");
  });
});
