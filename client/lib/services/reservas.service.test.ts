import { beforeEach, describe, expect, it } from "vitest";
import { crearReservaDemo, obtenerReservasParaAdmin } from "@/lib/services/reservas.service";
import { acelerarSimulacion } from "@/tests/helpers";

const DATOS = {
  canchaId: "cancha-1",
  canchaNombre: "Fútbol 5 Los Álamos",
  horarioId: "cancha-1-2026-11-20-19:00",
  fecha: "2026-11-20",
  inicio: "19:00",
  fin: "20:00",
  montoTotal: 18000,
  usuarioId: "usuario-1",
};

describe("reservas.service (demo)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("crea una reserva exitosa (201) pendiente de pago", async () => {
    acelerarSimulacion();
    const respuesta = await crearReservaDemo(DATOS);
    expect(respuesta.codigo).toBe(201);
    expect(respuesta.reserva?.estado).toBe("pendiente");
    expect(respuesta.reserva?.expiracion).toBeTruthy();
  });

  it("aplica la retención configurable a la expiración", async () => {
    acelerarSimulacion({ retencionReservaMin: 2 });
    const respuesta = await crearReservaDemo({ ...DATOS, horarioId: "otro-horario" });
    const creada = new Date(respuesta.reserva!.creadaEn).getTime();
    const expira = new Date(respuesta.reserva!.expiracion!).getTime();
    expect(expira - creada).toBe(120_000);
  });

  it("devuelve409 cuando el horario ya tiene una reserva activa", async () => {
    acelerarSimulacion({ semaforos: true });
    const primera = await crearReservaDemo(DATOS);
    expect(primera.codigo).toBe(201);

    const segunda = await crearReservaDemo(DATOS);
    expect(segunda.codigo).toBe(409);
  });

  it("con semáforos desactivados no bloquea el duplicado", async () => {
    acelerarSimulacion({ semaforos: false });
    const primera = await crearReservaDemo({ ...DATOS, horarioId: "horario-libre" });
    expect(primera.codigo).toBe(201);

    const segunda = await crearReservaDemo({ ...DATOS, horarioId: "horario-libre" });
    expect(segunda.codigo).toBe(201);
  });

  it("devuelve422 con datos incompletos", async () => {
    acelerarSimulacion();
    const respuesta = await crearReservaDemo({ ...DATOS, usuarioId: "" });
    expect(respuesta.codigo).toBe(422);
  });

  it("la latencia simulada0 usa el retardo base (reserva lenta pero funcional)", async () => {
    acelerarSimulacion({ latenciaSimuladaMs: 1 });
    const respuesta = await crearReservaDemo({ ...DATOS, horarioId: "horario-rapido" });
    expect(respuesta.codigo).toBe(201);
  });

  it("obtenerReservasParaAdmin trae cancha y usuario", async () => {
    acelerarSimulacion();
    const reservas = await obtenerReservasParaAdmin();
    expect(reservas.length).toBeGreaterThan(0);
    for (const item of reservas) {
      expect(item.cancha).toBeTruthy();
      expect(item.usuario).toBeTruthy();
    }
  });
});
