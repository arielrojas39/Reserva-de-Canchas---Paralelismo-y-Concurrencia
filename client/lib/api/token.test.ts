import { beforeEach, describe, expect, it } from "vitest";
import { limpiarToken, obtenerToken, guardarToken } from "@/lib/api/token";

describe("token JWT", () => {
  beforeEach(() => window.localStorage.clear());

  it("guarda y recupera el token con la clave propia", () => {
    guardarToken("jwt-de-prueba");
    expect(obtenerToken()).toBe("jwt-de-prueba");
    expect(window.localStorage.getItem("canchasplay:token")).toBe("jwt-de-prueba");
  });

  it("limpia el token", () => {
    guardarToken("jwt-de-prueba");
    limpiarToken();
    expect(obtenerToken()).toBeNull();
  });
});
