import { beforeEach, describe, expect, it } from "vitest";
import { PASSWORD_DEMO } from "@/lib/mocks/auth.mock";
import { iniciarSesionDemo, registrarseDemo } from "@/lib/services/auth.service";
import { acelerarSimulacion } from "@/tests/helpers";

describe("auth.service (demo)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    acelerarSimulacion();
  });

  it("inicia sesión con una cuenta mock y la contraseña demo", async () => {
    const resultado = await iniciarSesionDemo("martin.gomez@example.com", PASSWORD_DEMO);
    expect(resultado.ok).toBe(true);
    expect(resultado.usuario?.nombre).toBe("Martín Gómez");
  });

  it("es case-insensitive con el email", async () => {
    const resultado = await iniciarSesionDemo("MARTIN.GOMEZ@EXAMPLE.COM", PASSWORD_DEMO);
    expect(resultado.ok).toBe(true);
  });

  it("rechaza la contraseña incorrecta", async () => {
    const resultado = await iniciarSesionDemo("martin.gomez@example.com", "otra-clave");
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toContain("Credenciales demo incorrectas");
  });

  it("rechaza un email inexistente", async () => {
    const resultado = await iniciarSesionDemo("nadie@example.com", PASSWORD_DEMO);
    expect(resultado.ok).toBe(false);
  });

  it("el registro es simulado y detecta emails duplicados", async () => {
    const duplicado = await registrarseDemo({
      nombre: "Otro",
      email: "ana.admin@example.com",
      password: "secreta123",
    });
    expect(duplicado.ok).toBe(false);
    expect(duplicado.error).toContain("ya está registrado");

    const nuevo = await registrarseDemo({
      nombre: "Nuevo Usuario",
      email: "nuevo@example.com",
      password: "secreta123",
    });
    expect(nuevo.ok).toBe(true);
  });
});
