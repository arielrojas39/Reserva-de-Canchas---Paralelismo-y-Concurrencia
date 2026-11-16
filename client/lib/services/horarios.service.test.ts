import { beforeEach, describe, expect, it } from "vitest";
import {
  agregarHorario,
  eliminarHorario,
  finDesdeInicio,
  obtenerHorarios,
  obtenerHorariosDeCancha,
} from "@/lib/services/horarios.service";
import { CLAVES_DEMO } from "@/lib/services/demo.store";
import { acelerarSimulacion } from "@/tests/helpers";

describe("horarios.service (demo)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    acelerarSimulacion();
  });

  it("finDesdeInicio calcula la franja de una hora", () => {
    expect(finDesdeInicio("18:00")).toBe("19:00");
    expect(finDesdeInicio("23:00")).toBe("00:00");
    expect(finDesdeInicio("09:30")).toBe("10:30");
  });

  it("las canchas mock se siembran con la grilla de referencia", async () => {
    const horarios = await obtenerHorariosDeCancha("cancha-1");
    expect(horarios).toEqual(["18:00", "19:00", "20:00", "21:00"]);
  });

  it("obtenerHorarios deriva la grilla configurada por cancha", async () => {
    await agregarHorario("cancha-1", "22:00");
    const delDia = await obtenerHorarios("cancha-1", "2026-11-10");
    expect(delDia.map((h) => h.inicio)).toEqual(["18:00", "19:00", "20:00", "21:00", "22:00"]);
    expect(delDia[0].fin).toBe("19:00");
  });

  it("agregarHorario rechaza duplicados y horas inválidas", async () => {
    const duplicado = await agregarHorario("cancha-1", "18:00");
    expect(duplicado.ok).toBe(false);

    const invalido = await agregarHorario("cancha-1", "25:00");
    expect(invalido.ok).toBe(false);

    const valido = await agregarHorario("cancha-1", "09:00");
    expect(valido.ok).toBe(true);
  });

  it("eliminarHorario quita la hora y persiste", async () => {
    const resultado = await eliminarHorario("cancha-1", "19:00");
    expect(resultado.ok).toBe(true);
    expect(await obtenerHorariosDeCancha("cancha-1")).not.toContain("19:00");

    const guardado = window.localStorage.getItem(CLAVES_DEMO.horariosCanchas);
    expect(guardado).toContain("cancha-1");
  });

  it("eliminarHorario inexistente devuelve error", async () => {
    const resultado = await eliminarHorario("cancha-1", "07:00");
    expect(resultado.ok).toBe(false);
  });

  it("una cancha sin horarios devuelve grilla vacía", async () => {
    await eliminarHorario("cancha-1", "18:00");
    await eliminarHorario("cancha-1", "19:00");
    await eliminarHorario("cancha-1", "20:00");
    await eliminarHorario("cancha-1", "21:00");
    const grilla = await obtenerHorarios("cancha-1", "2026-11-10");
    expect(grilla).toEqual([]);
  });
});
