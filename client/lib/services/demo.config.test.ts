import { beforeEach, describe, expect, it } from "vitest";
import {
  CONFIG_DEMO_DEFECTO,
  esperarSimulado,
  guardarConfigDemo,
  leerConfigDemo,
  ocupacionSimulada,
  plazoExpiracionMs,
  restablecerConfigDemo,
} from "@/lib/services/demo.config";

describe("demo.config (parámetros de la demostración)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("devuelve los valores por defecto sin configuración guardada", () => {
    expect(leerConfigDemo()).toEqual(CONFIG_DEMO_DEFECTO);
  });

  it("acota los valores fuera de rango al guardar", () => {
    const guardada = guardarConfigDemo({
      semaforos: false,
      latenciaSimuladaMs: 999_999,
      retencionReservaMin: -5,
      // @ts-expect-error — valor inválido a propósito para probar la normalización.
      escenarioReserva: "inventado",
    });
    expect(guardada.latenciaSimuladaMs).toBe(10_000);
    expect(guardada.retencionReservaMin).toBe(1);
    expect(guardada.escenarioReserva).toBe("auto");
    expect(guardada.semaforos).toBe(false);
  });

  it("fusiona parciales sin pisar el resto", () => {
    guardarConfigDemo({ retencionReservaMin: 30 });
    const config = guardarConfigDemo({ semaforos: false });
    expect(config.retencionReservaMin).toBe(30);
    expect(config.semaforos).toBe(false);
  });

  it("restablece los valores por defecto", () => {
    guardarConfigDemo({ latenciaSimuladaMs: 3000 });
    expect(restablecerConfigDemo()).toEqual(CONFIG_DEMO_DEFECTO);
    expect(leerConfigDemo()).toEqual(CONFIG_DEMO_DEFECTO);
  });

  it("plazoExpiracionMs refleja la retención configurada", () => {
    guardarConfigDemo({ retencionReservaMin: 2 });
    expect(plazoExpiracionMs()).toBe(120_000);
    expect(ocupacionSimulada()).toBe(true);
  });

  it("esperarSimulado usa la latencia configurada cuando hay", async () => {
    guardarConfigDemo({ latenciaSimuladaMs: 20 });
    const inicio = performance.now();
    await esperarSimulado(10_000);
    // Debe esperar ~20ms (la configurada), no10s (la base).
    expect(performance.now() - inicio).toBeLessThan(1000);
  });

  it("esperarSimulado usa el retardo base con latencia en0", async () => {
    guardarConfigDemo({ latenciaSimuladaMs: 0 });
    const inicio = performance.now();
    await esperarSimulado(30);
    expect(performance.now() - inicio).toBeGreaterThanOrEqual(20);
  });

  it("tolera JSON corrupto en el store", () => {
    window.localStorage.setItem("canchasplay:config-demo", "{no-json");
    expect(leerConfigDemo()).toEqual(CONFIG_DEMO_DEFECTO);
  });
});
