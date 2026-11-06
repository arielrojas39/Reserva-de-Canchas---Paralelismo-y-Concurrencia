import { CLAVES_DEMO } from "@/lib/services/demo.store";
import type { Usuario } from "@/types";

/**
 * Helpers compartidos de las pruebas (solo tests).
 *
 * La latencia simulada se acelera a 1 ms para que los servicios
 * resuelvan casi instantáneamente en jsdom.
 */

export function acelerarSimulacion(
  parciales: Partial<{
    semaforos: boolean;
    latenciaSimuladaMs: number;
    retencionReservaMin: number;
  }> = {},
): void {
  window.localStorage.setItem(
    CLAVES_DEMO.config,
    JSON.stringify({
      semaforos: true,
      latenciaSimuladaMs: 1,
      retencionReservaMin: 15,
      escenarioReserva: "auto",
      escenarioPago: "auto",
      ...parciales,
    }),
  );
}

export const USUARIO_CLIENTE: Usuario = {
  id: "usuario-1",
  nombre: "Martín Gómez",
  email: "martin.gomez@example.com",
  rol: "cliente",
  creadoEn: "2026-09-02T12:00:00.000Z",
};

export const USUARIO_ADMIN: Usuario = {
  id: "usuario-3",
  nombre: "Ana Admin",
  email: "ana.admin@example.com",
  rol: "admin",
  creadoEn: "2026-09-20T12:00:00.000Z",
};

export function sembrarSesion(usuario: Usuario): void {
  window.localStorage.setItem("canchasplay:sesion-demo", JSON.stringify(usuario));
}
