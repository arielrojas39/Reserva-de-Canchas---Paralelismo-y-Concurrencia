import { afterEach, describe, expect, it, vi } from "vitest";
import { guardarToken, limpiarToken, obtenerToken } from "@/lib/api/token";
import { crearReserva } from "@/lib/services/reservas.service";

const datos = {
  canchaId: "12",
  canchaNombre: "Cancha Norte",
  horarioId: "12-2026-11-10-19:00",
  fecha: "2026-11-10",
  inicio: "19:00",
  fin: "20:00",
  montoTotal: 24500,
  usuarioId: "3",
};

describe("reservas.service API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    limpiarToken();
  });

  it("crea una reserva real con JWT y mapea la respuesta", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:8000/");
    guardarToken("jwt-de-prueba");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 8,
          court_id: 12,
          user_id: 3,
          court_name: "Cancha Norte",
          date: "2026-11-10",
          time: "19:00:00",
          total_price: "24500.00",
          status: "pending",
          created_at: "2026-11-05T12:00:00Z",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await crearReserva(datos);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:8000/reservations");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer jwt-de-prueba");
    expect(JSON.parse(String(init.body))).toEqual({
      court_id: 12,
      date: datos.fecha,
      time: datos.inicio,
    });
    expect(resultado).toMatchObject({ codigo: 201, reserva: { id: "8", estado: "pendiente" } });
  });

  it("limpia el token y devuelve 401 cuando la sesión venció", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:8000");
    guardarToken("jwt-vencido");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Token inválido o expirado" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const resultado = await crearReserva(datos);

    expect(resultado.codigo).toBe(401);
    expect(obtenerToken()).toBeNull();
  });
});
