import { afterEach, describe, expect, it, vi } from "vitest";
import { obtenerToken, limpiarToken } from "@/lib/api/token";
import { iniciarSesion } from "@/lib/services/auth.service";

describe("auth.service API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    limpiarToken();
  });

  it("guarda el JWT y obtiene el usuario autenticado", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:8000");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "jwt-real", token_type: "bearer" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 9,
            name: "Cliente API",
            email: "cliente@example.com",
            role: "customer",
            is_active: true,
            created_at: "2026-11-05T12:00:00Z",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await iniciarSesion("cliente@example.com", "una-clave-segura");

    expect(resultado).toMatchObject({
      ok: true,
      usuario: { id: "9", nombre: "Cliente API", rol: "cliente" },
    });
    expect(obtenerToken()).toBe("jwt-real");
    expect(
      new Headers((fetchMock.mock.calls[1]?.[1] as RequestInit).headers).get("Authorization"),
    ).toBe("Bearer jwt-real");
  });
});
