import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider, useSession } from "@/contexts/SessionContext";
import { Header } from "@/components/layout/Header/Header";
import { PASSWORD_DEMO } from "@/lib/mocks/auth.mock";
import { USUARIO_ADMIN, USUARIO_CLIENTE, sembrarSesion } from "@/tests/helpers";
import { act } from "react";

function renderHeader() {
  return render(
    <SessionProvider>
      <Header />
    </SessionProvider>,
  );
}

describe("Header (navegación por roles de la demo)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("visitante ve Iniciar sesión y Registrarse, y el enlace público Mis reservas", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
    // "Mis reservas" es un enlace de navegación público; la ruta se protege con SessionGate.
    expect(screen.getByRole("link", { name: "Mis reservas" })).toHaveAttribute(
      "href",
      "/mis-reservas",
    );
    expect(screen.queryByRole("link", { name: "Administración" })).not.toBeInTheDocument();
  });

  it("cliente logueado ve Mis reservas pero no Administración", () => {
    sembrarSesion(USUARIO_CLIENTE);
    renderHeader();
    expect(screen.getByRole("link", { name: "Mis reservas" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Administración" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Martín Gómez/ })).toBeInTheDocument();
  });

  it("el administrador ve el enlace de Administración", () => {
    sembrarSesion(USUARIO_ADMIN);
    renderHeader();
    expect(screen.getByRole("link", { name: "Administración" })).toHaveAttribute("href", "/admin");
  });

  it("el menú hamburguesa abre y cierra con aria-expanded", async () => {
    renderHeader();
    const hamburguesa = screen.getByRole("button", { name: "Abrir menú" });
    expect(hamburguesa).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(hamburguesa);
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("navigation", { name: "Navegación móvil" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeInTheDocument();
  });

  it("cerrar sesión borra la sesión demo", async () => {
    sembrarSesion(USUARIO_CLIENTE);
    renderHeader();

    await userEvent.click(screen.getByRole("button", { name: /Martín Gómez/ }));
    await userEvent.click(screen.getByRole("button", { name: /Cerrar sesión/ }));

    expect(window.localStorage.getItem("canchasplay:sesion-demo")).toBeNull();
  });
});

describe("flujo de login demo (contexto de sesión)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("iniciarSesion persiste al usuario y cerrarSesion lo borra", async () => {
    let iniciar!: (email: string, password: string) => Promise<{ ok: boolean }>;
    let cerrar!: () => void;

    function Captura() {
      const sesion = useSession();
      iniciar = sesion.iniciarSesion;
      cerrar = sesion.cerrarSesion;
      return null;
    }

    render(
      <SessionProvider>
        <Captura />
      </SessionProvider>,
    );

    let resultado!: { ok: boolean };
    await act(async () => {
      resultado = await iniciar("ana.admin@example.com", PASSWORD_DEMO);
    });
    expect(resultado.ok).toBe(true);
    expect(window.localStorage.getItem("canchasplay:sesion-demo")).toContain("Ana Admin");

    await act(async () => {
      cerrar();
    });
    expect(window.localStorage.getItem("canchasplay:sesion-demo")).toBeNull();
  });
});
