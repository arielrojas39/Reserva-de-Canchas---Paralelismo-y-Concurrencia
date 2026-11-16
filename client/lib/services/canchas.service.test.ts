import { beforeEach, describe, expect, it } from "vitest";
import { crearCancha, obtenerCanchas, obtenerCanchasAdmin } from "@/lib/services/canchas.service";
import { CLAVES_DEMO } from "@/lib/services/demo.store";
import { acelerarSimulacion } from "@/tests/helpers";

describe("canchas.service (demo)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    acelerarSimulacion();
  });

  it("obtenerCanchas solo devuelve activas (catálogo público)", async () => {
    const canchas = await obtenerCanchas();
    expect(canchas.every((c) => c.activa)).toBe(true);
  });

  it("crearCancha persiste la cancha con valores por defecto", async () => {
    const resultado = await crearCancha({
      nombre: "Cancha Nueva Test",
      descripcion: "Cancha creada durante las pruebas unitarias.",
      activa: true,
    });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.cancha.precioPorHora).toBeGreaterThan(0);
      expect(resultado.cancha.formato).toBe("futbol5");
    }

    const admin = await obtenerCanchasAdmin();
    expect(admin.some((c) => c.nombre === "Cancha Nueva Test")).toBe(true);
  });

  it("crearCancha rechaza nombres duplicados (case-insensitive)", async () => {
    const primero = await crearCancha({
      nombre: "Cancha Duplicada",
      descripcion: "Primera cancha con este nombre en la prueba.",
      activa: true,
    });
    expect(primero.ok).toBe(true);

    const duplicado = await crearCancha({
      nombre: "  cancha DUPLICADA ",
      descripcion: "Segunda cancha con el mismo nombre normalizado.",
      activa: false,
    });
    expect(duplicado.ok).toBe(false);
    if (!duplicado.ok) {
      expect(duplicado.error).toContain("Ya existe una cancha con ese nombre");
    }
  });

  it("las canchas creadas persisten en el store local", async () => {
    await crearCancha({
      nombre: "Cancha Persistida",
      descripcion: "Verificación de persistencia en localStorage de la demo.",
      activa: true,
    });
    const guardado = window.localStorage.getItem(CLAVES_DEMO.canchas);
    expect(guardado).toContain("Cancha Persistida");
  });

  it("una cancha inactiva no aparece en el catálogo público", async () => {
    await crearCancha({
      nombre: "Cancha Inactiva Test",
      descripcion: "Cancha inactiva creada para validar el filtrado del catálogo.",
      activa: false,
    });
    const publicas = await obtenerCanchas();
    const admin = await obtenerCanchasAdmin();
    expect(publicas.some((c) => c.nombre === "Cancha Inactiva Test")).toBe(false);
    expect(admin.some((c) => c.nombre === "Cancha Inactiva Test")).toBe(true);
  });
});
