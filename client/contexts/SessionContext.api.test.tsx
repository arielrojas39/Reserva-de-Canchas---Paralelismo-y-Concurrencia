import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SessionProvider, useSession } from "@/contexts/SessionContext";
import { guardarToken, obtenerToken, limpiarToken } from "@/lib/api/token";

function SessionState() {
  const { usuario, isRestoring } = useSession();
  return <p role="status">{isRestoring ? "Restoring" : (usuario?.email ?? "Visitor")}</p>;
}

describe("SessionContext API restoration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    limpiarToken();
  });

  it("clears an expired JWT after GET /auth/me returns 401", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:8000");
    guardarToken("expired-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Not authenticated" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(
      <SessionProvider>
        <SessionState />
      </SessionProvider>,
    );

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Visitor"));
    expect(obtenerToken()).toBeNull();
  });
});
