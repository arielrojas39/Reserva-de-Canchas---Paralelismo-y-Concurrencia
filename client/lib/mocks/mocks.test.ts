import { describe, expect, it } from "vitest";
import { canchasMock } from "@/lib/mocks/canchas.mock";
import { reservasMock } from "@/lib/mocks/reservas.mock";
import { usuariosMock } from "@/lib/mocks/usuarios.mock";
import { HORAS_DEMO } from "@/lib/mocks/horarios.mock";
import type { EstadoReserva } from "@/types";

/**
 * Consistencia de los datos mock: relaciones e invariantes que el
 * resto de la aplicación da por ciertos.
 */

const ESTADOS_VALIDOS: EstadoReserva[] = [
  "pendiente",
  "pagando",
  "confirmada",
  "completada",
  "cancelada",
  "expirada",
];

describe("consistencia de datos mock", () => {
  it("las canchas tienen IDs únicos y precios positivos", () => {
    const ids = canchasMock.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const cancha of canchasMock) {
      expect(cancha.nombre.length).toBeGreaterThan(0);
      expect(cancha.precioPorHora).toBeGreaterThan(0);
    }
  });

  it("los usuarios tienen emails únicos y roles válidos", () => {
    const emails = usuariosMock.map((u) => u.email.toLowerCase());
    expect(new Set(emails).size).toBe(emails.length);
    for (const usuario of usuariosMock) {
      expect(["cliente", "admin"]).toContain(usuario.rol);
    }
  });

  it("las reservas referencian canchas y usuarios existentes", () => {
    const idsCancha = new Set(canchasMock.map((c) => c.id));
    const idsUsuario = new Set(usuariosMock.map((u) => u.id));
    for (const reserva of reservasMock) {
      expect(idsCancha.has(reserva.canchaId)).toBe(true);
      expect(idsUsuario.has(reserva.usuarioId)).toBe(true);
      expect(ESTADOS_VALIDOS).toContain(reserva.estado);
    }
  });

  it("la grilla horaria de referencia son franjas de una hora coherentes", () => {
    expect(HORAS_DEMO.length).toBeGreaterThan(0);
    for (const franja of HORAS_DEMO) {
      const [horaInicio] = franja.inicio.split(":").map(Number);
      const [horaFin] = franja.fin.split(":").map(Number);
      expect(horaFin).toBe(horaInicio + 1);
    }
  });

  it("existe al menos una cuenta de cliente y una de administrador", () => {
    expect(usuariosMock.some((u) => u.rol === "cliente")).toBe(true);
    expect(usuariosMock.some((u) => u.rol === "admin")).toBe(true);
  });
});
