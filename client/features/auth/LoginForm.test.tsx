import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider } from "@/contexts/SessionContext";
import { LoginForm } from "@/features/auth/LoginForm";
import { PASSWORD_DEMO } from "@/lib/mocks/auth.mock";
import { acelerarSimulacion } from "@/tests/helpers";

const routerMock = (
  globalThis as unknown as { __routerMock: { replace: ReturnType<typeof vi.fn> } }
).__routerMock;

function renderLogin() {
  return render(
    <SessionProvider>
      <LoginForm />
    </SessionProvider>,
  );
}

describe("LoginForm (validaciones y flujo demo)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    acelerarSimulacion();
    routerMock.replace.mockClear();
  });

  it("muestra errores de validación con datos inválidos", async () => {
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText("Ingresá un correo electrónico válido.")).toBeInTheDocument();
    expect(screen.getByText("Ingresá tu contraseña.")).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("muestra el error del servicio con credenciales incorrectas", async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/Correo electrónico/), "martin.gomez@example.com");
    await userEvent.type(screen.getByLabelText(/Contraseña/), "clave-mala");
    await userEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Credenciales demo incorrectas/);
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("inicia sesión con credenciales válidas y navega al inicio", async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/Correo electrónico/), "ana.admin@example.com");
    await userEvent.type(screen.getByLabelText(/Contraseña/), PASSWORD_DEMO);
    await userEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/"));
    expect(window.localStorage.getItem("canchasplay:sesion-demo")).toContain("Ana Admin");
  });
});
