import { afterEach, describe, expect, it, vi } from "vitest";
import { guardarToken, limpiarToken } from "@/lib/api/token";
import { iniciarPagoMercadoPago } from "@/lib/services/pagos.service";

describe("pagos.service Mercado Pago", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    limpiarToken();
  });

  it("crea la preferencia y devuelve la URL de checkout", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:8000");
    guardarToken("jwt-de-prueba");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          reservation_id: 8,
          preference_id: "pref-123",
          checkout_url: "https://sandbox.mercadopago.com.ar/checkout",
          init_point: "https://www.mercadopago.com.ar/checkout",
          sandbox_init_point: "https://sandbox.mercadopago.com.ar/checkout",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await iniciarPagoMercadoPago("8");

    expect(resultado).toEqual({
      ok: true,
      checkoutUrl: "https://sandbox.mercadopago.com.ar/checkout",
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:8000/payments/preferences");
    expect(JSON.parse(String(init.body))).toEqual({ reservation_id: 8 });
  });

  it("traduce 503 a un mensaje de Mercado Pago no configurado", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:8000");
    guardarToken("jwt-de-prueba");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Mercado Pago no está configurado." }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const resultado = await iniciarPagoMercadoPago("8");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toContain("Mercado Pago");
  });
});
