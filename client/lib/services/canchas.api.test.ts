import { afterEach, describe, expect, it, vi } from "vitest";
import { guardarToken, limpiarToken } from "@/lib/api/token";
import { actualizarCancha, crearCancha, eliminarCancha } from "@/lib/services/canchas.service";

describe("administración de canchas por API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    limpiarToken();
  });

  it("crea usando la ruta POST con barra final que expone el backend", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 5,
          name: "Cancha nueva",
          description: "Descripción de cancha",
          price_per_hour: "15000.00",
          players_per_team: 5,
          location: "Club",
          surface_type: "synthetic",
          is_active: true,
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(
      await crearCancha({
        nombre: "Cancha nueva",
        descripcion: "Descripción de cancha",
        activa: true,
      }),
    ).toMatchObject({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8000/courts/");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });

  it("guarda nombre, descripción y precio con autorización", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    guardarToken("test-admin");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 4,
          name: "Cancha editada",
          description: "Descripción actualizada",
          price_per_hour: "18000.50",
          players_per_team: 5,
          location: "Club",
          surface_type: "synthetic",
          is_active: true,
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const resultado = await actualizarCancha("4", {
      nombre: "Cancha editada",
      descripcion: "Descripción actualizada",
      activa: true,
      precioPorHora: 18000.5,
    });
    expect(resultado).toMatchObject({
      ok: true,
      cancha: { nombre: "Cancha editada", precioPorHora: 18000.5 },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8000/courts/4");
    expect(init.method).toBe("PATCH");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer test-admin");
    expect(JSON.parse(init.body)).toEqual({
      name: "Cancha editada",
      description: "Descripción actualizada",
      is_active: true,
      price_per_hour: "18000.50",
    });
  });

  it("acepta la baja con respuesta vacía 204", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    guardarToken("test-admin");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(eliminarCancha("4")).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get("Authorization")).toBe(
      "Bearer test-admin",
    );
  });

  it("propaga errores de permisos sin fingir una baja exitosa", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ detail: "Sin permisos" }), { status: 403 }),
        ),
    );
    await expect(eliminarCancha("4")).rejects.toThrow("Sin permisos");
  });
});
