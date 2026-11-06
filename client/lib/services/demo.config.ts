import { CLAVES_DEMO, escribirLocal, leerLocal } from "@/lib/services/demo.store";

/**
 * Configuración visual del entorno de demostración — SOLO DEMO.
 *
 * Parámetros que el panel administrativo puede modificar para
 * exponer la plataforma (latencias, retención, control simulado de
 * solicitudes simultáneas y escenarios de respuesta). Solo afectan
 * la SIMULACIÓN del frontend: no hay backend, cobros ni lógica de
 * concurrencia real detrás de estas opciones.
 */

/** Escenario preseleccionado para el flujo de reserva. */
export type EscenarioReserva = "auto" | "exitosa" | "conflicto" | "ocupado" | "expirada";

/** Escenario preseleccionado para el flujo de pago. */
export type EscenarioPago = "auto" | "aprobado" | "rechazado";

export interface ConfigDemo {
  /**
   * Control simulado de solicitudes simultáneas ("semáforos").
   * Solo decide si la demostración muestra el 409 de conflicto al
   * intentar reservar un horario ya tomado.
   */
  semaforos: boolean;
  /** Retardo de las respuestas simuladas en ms; 0 = valor por defecto de cada flujo. */
  latenciaSimuladaMs: number;
  /** Minutos que una reserva queda pendiente de pago antes de expirar. */
  retencionReservaMin: number;
  /** Respuesta por defecto del selector de simulación del modal de reserva. */
  escenarioReserva: EscenarioReserva;
  /** Respuesta por defecto del selector de simulación del modal de pago. */
  escenarioPago: EscenarioPago;
}

export const CONFIG_DEMO_DEFECTO: ConfigDemo = {
  semaforos: true,
  latenciaSimuladaMs: 0,
  retencionReservaMin: 15,
  escenarioReserva: "auto",
  escenarioPago: "auto",
};

const ESCENARIOS_RESERVA: EscenarioReserva[] = [
  "auto",
  "exitosa",
  "conflicto",
  "ocupado",
  "expirada",
];
const ESCENARIOS_PAGO: EscenarioPago[] = ["auto", "aprobado", "rechazado"];

const LATENCIA_MAX_MS = 10_000;
const RETENCION_MAX_MIN = 120;

function enteroEnRango(valor: number, min: number, max: number, porDefecto: number): number {
  if (!Number.isFinite(valor)) return porDefecto;
  return Math.min(Math.max(Math.trunc(valor), min), max);
}

function normalizar(config: Partial<ConfigDemo>): ConfigDemo {
  return {
    semaforos:
      typeof config.semaforos === "boolean" ? config.semaforos : CONFIG_DEMO_DEFECTO.semaforos,
    latenciaSimuladaMs: enteroEnRango(
      config.latenciaSimuladaMs ?? CONFIG_DEMO_DEFECTO.latenciaSimuladaMs,
      0,
      LATENCIA_MAX_MS,
      CONFIG_DEMO_DEFECTO.latenciaSimuladaMs,
    ),
    retencionReservaMin: enteroEnRango(
      config.retencionReservaMin ?? CONFIG_DEMO_DEFECTO.retencionReservaMin,
      1,
      RETENCION_MAX_MIN,
      CONFIG_DEMO_DEFECTO.retencionReservaMin,
    ),
    escenarioReserva: ESCENARIOS_RESERVA.includes(config.escenarioReserva as EscenarioReserva)
      ? (config.escenarioReserva as EscenarioReserva)
      : CONFIG_DEMO_DEFECTO.escenarioReserva,
    escenarioPago: ESCENARIOS_PAGO.includes(config.escenarioPago as EscenarioPago)
      ? (config.escenarioPago as EscenarioPago)
      : CONFIG_DEMO_DEFECTO.escenarioPago,
  };
}

/** Configuración vigente de la demo (con valores por defecto fusionados). */
export function leerConfigDemo(): ConfigDemo {
  return normalizar(leerLocal<Partial<ConfigDemo>>(CLAVES_DEMO.config, {}));
}

/** Guarda (fusionando y acotando) la configuración de la demo. */
export function guardarConfigDemo(parcial: Partial<ConfigDemo>): ConfigDemo {
  const config = normalizar({ ...leerConfigDemo(), ...parcial });
  escribirLocal(CLAVES_DEMO.config, config);
  return config;
}

/** Restaura la configuración por defecto de la demostración. */
export function restablecerConfigDemo(): ConfigDemo {
  escribirLocal(CLAVES_DEMO.config, CONFIG_DEMO_DEFECTO);
  return CONFIG_DEMO_DEFECTO;
}

/**
 * Espera simulada parametrizable: si la configuración define una
 * latencia (> 0 ms) se usa; si no, el retardo por defecto del flujo.
 */
export function esperarSimulado(baseMs: number): Promise<void> {
  const { latenciaSimuladaMs } = leerConfigDemo();
  const espera = latenciaSimuladaMs > 0 ? latenciaSimuladaMs : baseMs;
  return new Promise((resolve) => setTimeout(resolve, espera));
}

/** Plazo de pago de una reserva nueva, según la configuración. */
export function plazoExpiracionMs(): number {
  return leerConfigDemo().retencionReservaMin * 60_000;
}

/** ¿La demo muestra el control simulado de simultaneidad (409)? */
export function ocupacionSimulada(): boolean {
  return leerConfigDemo().semaforos;
}
