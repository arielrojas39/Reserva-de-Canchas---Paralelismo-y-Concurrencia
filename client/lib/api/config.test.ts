import { afterEach, describe, expect, it, vi } from "vitest";
import { apiHabilitada, baseUrlApi } from "@/lib/api/config";

describe("API config", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("deja el modo demo activo si la URL está ausente o vacía", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    expect(apiHabilitada()).toBe(false);
    expect(baseUrlApi()).toBeNull();
  });

  it("normaliza las barras finales de la URL configurada", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", " http://127.0.0.1:8000/// ");
    expect(apiHabilitada()).toBe(true);
    expect(baseUrlApi()).toBe("http://127.0.0.1:8000");
  });
});
